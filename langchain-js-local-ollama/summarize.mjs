import {
  getSourceForBlog,
  getSourceForEPub,
  getSourceForPDF,
  getSourceForText,
} from "./sources.mjs";

// import { getSummaryWithQuestionsPrompts } from "./prompts.mjs";
import { getSummaryPrompts } from "./prompts.mjs";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import { Ollama } from "langchain/llms/ollama";
import { PromptTemplate } from "langchain/prompts";
import { loadSummarizationChain } from "langchain/chains";

const { name, question, loader } = await getSourceForEPub();
// const { name, question, loader } = await getSourceForPDF();
// const { name, question, loader } = await getSourceForText();
// const { name, question, loader } = await getSourceForBlog();

console.log(`\n## 1- Fetch/split document (${name})\n`);

const docs = await loader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 3000,
  chunkOverlap: 200,
});

const splitDocuments = await splitter.splitDocuments(docs);
console.log(`  - split into ${splitDocuments.length} document chunks`);
// console.log(JSON.stringify(splitDocuments, null, 2));

// Llama 2 7b wrapped by Ollama
const model = new Ollama({
  baseUrl: "http://localhost:11434",
  model: "llama2",
  // model: "mistral",
});

const { questionPrompt, refinePrompt } = getSummaryPrompts();

const summarizeChain = loadSummarizationChain(model, {
  type: "refine",
  verbose: true,
  questionPrompt: PromptTemplate.fromTemplate(questionPrompt),
  refinePrompt: PromptTemplate.fromTemplate(refinePrompt),
});

console.log(`\n## 2- Summary Chain (${name})\n`);
const summary = await summarizeChain.run(splitDocuments);

console.log(`\n## 3- Final Summary and Questions for ${name}\n`);

console.log(summary);
