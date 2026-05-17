from rest_framework import serializers

class CodeTranslationSerializer(serializers.Serializer):
   # Source code that needs to be translated
   code = serializers.CharField()

   # The programming language of the input code
   target_language = serializers.ChoiceField(choices=["python", "java", "c++"])
   
   # The target programming language for translation
   input_language = serializers.ChoiceField(choices=["python", "java", "c++"])