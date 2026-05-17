from pathlib import Path

from transformers import RobertaTokenizer, T5ForConditionalGeneration, TextIteratorStreamer
from peft import PeftModel, PeftConfig
import threading

from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import CodeTranslationSerializer

# Path of the model used for translation
model_path = Path(__file__).resolve().parent / "early_stopping_lora_4bit_quant_codeT5-small-own-dataV4_100_epochs_batchsize_8"

peft_model_id = model_path

model = None
tokenizer = None
model_load_lock = threading.Lock()


def get_translation_model():
    global model, tokenizer

    if model is not None and tokenizer is not None:
        return model, tokenizer

    with model_load_lock:
        if model is not None and tokenizer is not None:
            return model, tokenizer

        adapter_file = peft_model_id / "adapter_model.safetensors"
        if adapter_file.exists() and adapter_file.read_bytes().startswith(b"version https://git-lfs.github.com/spec/v1"):
            raise RuntimeError(
                "The PEFT adapter weights were not downloaded. "
                "Install Git LFS, then run `git lfs pull` from the repository root "
                "so adapter_model.safetensors is the real model file instead of a Git LFS pointer."
            )

        # Load the PEFT (Parameter-Efficient Fine-Tuning) model configuration
        config = PeftConfig.from_pretrained(peft_model_id)

        # Load base model from pre-trained weights
        base_model = T5ForConditionalGeneration.from_pretrained(
            config.base_model_name_or_path,
            device_map="cpu", # Ensure model runs on CPU (can be adjusted to GPU if available)
        )

        # Load tokenizer from the base model
        tokenizer = RobertaTokenizer.from_pretrained(config.base_model_name_or_path)

        # Load fine-tuned model
        model = PeftModel.from_pretrained(base_model, peft_model_id)
        model = model.merge_and_unload()

        return model, tokenizer

class CodeTranslationView(APIView):
    """
    API View for translating source code from one programming language to another.
    Accepts a POST request with the source code, input language, and target language.
    Returns a streaming response with the translated code.
    """

    def post(self, request):
        """
        Handle POST requests for code translation.

        Expects JSON data with:
        - `code`: The source code to translate.
        - `input_language`: The language of the source code.
        - `target_language`: The desired language for translation.

        Returns:
        - A streaming HTTP response containing the translated code.
        - HTTP 400 if input validation fails.
        - HTTP 500 if an error occurs during translation.
        """

        # Validate the input data using the serializer
        serializer = CodeTranslationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                translation_model, translation_tokenizer = get_translation_model()
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

            # Extract validated data
            code = serializer.validated_data["code"]
            target_language = serializer.validated_data["target_language"]
            input_language = serializer.validated_data["input_language"]

            def generate_stream():
                """
                Generator function for streaming the translated code.

                Uses a separate thread to generate translations asynchronously
                while sending data in a streaming fashion to the client.
                """
                streamer = TextIteratorStreamer(translation_tokenizer, skip_prompt=True, skip_special_tokens=True)

                try:
                    # Preprocessing 
                    promt = f'translate {input_language} to {target_language}: {code}'
                    inputs = translation_tokenizer(promt, return_tensors="pt", max_length=2048, truncation=True)

                    # Start the generation in a separate thread
                    generation_kwargs = dict(inputs, streamer=streamer, max_new_tokens=1024)
                    generation_thread = threading.Thread(target=translation_model.generate, kwargs=generation_kwargs)
                    generation_thread.start()
                
                     # Stream the generated text
                    for new_text in streamer:
                        # Check if the client has closed the connection
                        if request.META.get("HTTP_CONNECTION") == "close":
                            return
                        yield new_text
                        
                except Exception as e:
                    return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Return a streaming HTTP response with the translated code
            return StreamingHttpResponse(generate_stream(), content_type="text/event-stream")

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
