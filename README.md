# Kabul - Code Translation

Web Application for translating code from one language (e.g Java) to another language (e.g. Python).

## Description

### Project Overview
This project aims to fine-tune existing models using the Hugging Face library for code translation tasks. The goal is to evaluate different models and datasets, adjusting hyperparameters to find the best-performing combination. The trained models, data, and results are stored in the model_training directory, which also includes an Excel file for model comparison. Additionally, a detailed research paper explaining the methodology and findings is included.

### Project structure
```Bash
\kabul
|
├──  /backend                               # Django backend code
|    ├── /api                               # Django REST API and used model for translation           
|    ├── /backend                           # Django project settings  
|    ├── Dockerfile                         # Dockerfile for Django backend
|    ├── manage.py                          # Django project entry point
|    └── requirements.txt                   # Python dependencies
|
├── /frontend                               # React frontend code    
|    ├── /public                            # Public assets
|    ├── /src                               # React components including App.js and App.css for the UI
|    ├── Dockerfile                         # Dockerfile for React frontend
|    ├── firebase.json                      # Firebase configuration for hosting and rewrites 
|    ├── package-log.json                   # Auto-generated lock file for dependencies, ensures consistent installs
|    └── package.json                       # Project metadata and dependencies for the React frontend
|
├── /model_training                         # Trained models, data, and results
|    ├── /benchmarking                      # Model benchmarking results and code used for evaluation    
|    └── /training_codes                    # Python notebooks for model training
|  
├── /report                                 # Folder including final project paper
|    └── Kabul_Code_Translation_Report.pdf
|    └── Kabul_Code_Translation_Report.tex
|    
├── docker-compose.yml                      # Docker Compose configuration for local setup
└── README.md                               # This README file
```

## Getting started

### Prerequisites
- Docker Desktop installed on your machine.
  - Installation guide: https://www.docker.com/products/docker-desktop/ 
- Docker Compose installed (comes with Docker Desktop).

### Installation Steps
1. **Clone the repository**
    ```bash
    git clone https://gitlab.lrz.de/bpc-ws-2425/kabul.git
    cd kabul
    ```

2. **Build and start the containers using Docker Compose**
    ```bash
    docker-compose --profile dev up
    ```
    This command will build and start both the React frontend and Django backend containers. It will also configure networking between the two services.

3. **Access the Application**
    
    Frontend (React): Open your browser and go to http://localhost:3000

### Online Access
Our application is currently deployed online and can be accessed directly without requiring local setup.
Visit the following link to explore the code translation functionality: https://code-translation.com

## Model Fine-Tuning & Benchmarking

This project uses Hugging Face's transformers library to fine-tune pre-trained models for code translation tasks. The goal is to benchmark various models with different hyperparameters and datasets to identify the most optimal configuration.

### Training
The model training code is included in the [model_training/training_codes](https://gitlab.lrz.de/bpc-ws-2425/kabul/-/tree/main/model_training/training_codes) directory. The training process involves loading the pre-trained model, preparing and tokenizing the training data, and fine-tuning the model on the target dataset. The training code is written in Python and uses the Hugging Face transformers library.

### Fine-Tuned Models
We fine-tuned following base models for code translation tasks:
- Salesforce/codeT5-small (https://huggingface.co/Salesforce/codet5-small)
- Salesforce/codeT5-base (https://huggingface.co/Salesforce/codet5-base)
- openai-community/gpt2 (https://huggingface.co/openai-community/gpt2)
- microsoft/codebert-base (https://huggingface.co/microsoft/codebert-base)
- facebook/bart-base (https://huggingface.co/facebook/bart-base)
- lirezamsh/small100 (https://huggingface.co/alirezamsh/small100)

### Datasets
For the model fine-tuning process, we use the following datasets:
- https://huggingface.co/datasets/NTU-NLP-sg/xCodeEval
- https://huggingface.co/datasets/ziwenyd/transcoder-geeksforgeeks
- https://huggingface.co/datasets/CM/codexglue_codetrans
- https://leetcode.ca/all/problems.html
- Version 1: An unbalanced custom dataset by combining the NTU-NLP-sg/xCodeEval and the ziwenyd/transcoder-geeksforgeeks dataset
- Version 2: An unbalanced custom dataset by combining the NTU-NLP-sg/xCodeEval, the ziwenyd/transcoder-geeksforgeeks, the CM/codexglue_codetrans dataset, as well as some instances generated by ChatGPT 
- Version 3: A balanced custom dataset created by webscraping data from LeetCode answers 
- Version 4: A balanced custom dataset created by combining webscraped data from LeetCode answers and the ziwenyd/transcoder-geeksforgeeks dataset


The custom datasets are stored in [model_training/training_codes/datasets](https://gitlab.lrz.de/bpc-ws-2425/kabul/-/tree/main/model_training/training_codes/datasets?ref_type=heads)

### Benchmarking
For benchmarking, we evaluate the performance of different fine-tuned models using the ROUGE score, TER score, BERTScore and Frugal score. The benchmarking results are stored in the form of an Excel file inside the [model_training/benchmarking/excel_result_files](https://gitlab.lrz.de/bpc-ws-2425/kabul/-/tree/main/model_training/benchmarking/excel_result_files?ref_type=heads) directory. 
We benchmarked the models using different test sets. We had one test set for each translation task (e.g. Java to Python, Python to Java, etc.) as well as a combined test set that included all translation tasks.
For easier comparison, the results are also visualized using differnts charts in the Excel file.
The benchmarking code is included in the [model_training/benchmarking](https://gitlab.lrz.de/bpc-ws-2425/kabul/-/tree/main/model_training/benchmarking?ref_type=heads) directory.
## Research Paper
A detailed report explaining the methodology, model evaluation, and results is included in the  [/report](https://gitlab.lrz.de/bpc-ws-2425/kabul/-/tree/main/report?ref_type=heads) directory. This report provides insights into the model selection, fine-tuning process and model evaluation.

## Troubleshooting: 
- when you run into issues like react-script not found try to run npm install in the /frontend folder from terminal first and the try the docker-compose command again 
- when the backend logs `SafetensorError: Error while deserializing header: HeaderTooLarge`, the model weights were likely not downloaded from Git LFS. Install Git LFS, then run `git lfs pull` from the repository root and restart Docker Compose.
