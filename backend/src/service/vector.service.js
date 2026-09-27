require("dotenv").config();
const { Pinecone } = require("@pinecone-database/pinecone");
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
const Cohratindex = pc.index(process.env.PINECONE_INDEX);
async function CreateMemory({ vectors, metadata, messageId }) {
  await Cohratindex.upsert({
    records: [
      {
        id: messageId,
        values: vectors,
        metadata: metadata,
      },
    ],
  });
}
async function queryMemory({ queryVector, metadata, limit = 5 }) {
  const data = await Cohratindex.query({
    vector: queryVector,
    topK: limit,
    filter: metadata || undefined,
    includeMetadata: true,
  });
  return data.matches;
}
async function DeleteMemory(ids = []) {
  if (ids.length)
    await Cohratindex.deleteMany({
      ids,
    });
}
module.exports = {
  CreateMemory,
  queryMemory,
  DeleteMemory,
};
