import evaluate
import pandas as pd

columns = [
    "model_name", "dataset_name", "training_size", "hyperparameters",
    "rouge1", "rouge2", "rougeL", "rougeLsum", 
    "ter", "bert_score", "frugal_score", "LoRA", "quantization", "earlystopping"
]

def compute_bert_score(preds, refs):
    bert_score = evaluate.load("bertscore")
    result = bert_score.compute(predictions=preds, references=refs, lang="en")
    return result

def compute_frugal_score(preds, refs):
    frugal_score = evaluate.load("frugalscore")
    result = frugal_score.compute(predictions=preds, references=refs)
    return result

def compute_rouge(preds, refs):
    rouge = evaluate.load("rouge")
    result = rouge.compute(predictions=preds, references=refs)
    print(result)
    return result["rouge1"], result["rouge2"], result["rougeL"], result["rougeLsum"]
    
def compute_ter(preds, refs):
    ter = evaluate.load("ter")
    return ter.compute(predictions=preds, references=refs)

def prepare_input_bleu(sentences):
    result = []
    
    for sentence_list in sentences:
        for sentence in sentence_list:
            print(sentence)
            words = sentence.split()
            result.append(words)
    
    return result

def benchmark_model(model_name, dataset_name, training_size, hyperparameters, preds, refs, result_path, save_results=False, lora=False, quantization=False, earlystopping=False):
    # Compute metrics
    rouge1, rouge2, rougeL, rougeLsum = compute_rouge(preds, refs)
    ter = compute_ter(preds, refs)
    bert_score = compute_bert_score(preds, refs)
    avg_bert_score_precision = sum(bert_score["precision"]) / len(bert_score["precision"])
    avg_bert_score_recall = sum(bert_score["recall"]) / len(bert_score["recall"])
    avg_bert_score_f1 = sum(bert_score["f1"]) / len(bert_score["f1"])
    avg_bert_score = {'precision': avg_bert_score_precision, 'recall': avg_bert_score_recall, 'f1': avg_bert_score_f1}
    
    frugal_score = compute_frugal_score(preds, refs)
    avg_frugal_score = sum(frugal_score["scores"]) / len(frugal_score["scores"])  

    # Prepare results to save later
    results = {
        "model_name": model_name,
        "dataset_name": dataset_name,
        "training_size": training_size,
        "hyperparameters": str(hyperparameters),
        "rouge1": rouge1,
        "rouge2": rouge2,
        "rougeL": rougeL,
        "rougeLsum": rougeLsum,
        "ter": ter,
        "bert_score": avg_bert_score,
        "frugal_score": avg_frugal_score,
        "LoRA": lora,
        "quantization": quantization,
        "earlystopping": earlystopping
    }

    if save_results:
        df = pd.read_excel(result_path)
        df = df[columns]
        df = pd.concat([df, pd.DataFrame([results])], ignore_index=True)
        df.to_excel(result_path)
    
    return results
