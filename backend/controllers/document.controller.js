const {
  saveDocuments,
  getUserDocuments,
  getUserDocumentById,
} = require("../services/document.service");
const {
 retryDocumentProcessing
}=require("../services/document.service");

const {
 deleteDocument
}=require("../services/document.service");

const uploadDocuments = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No PDF files provided." });
    }

    const documents = await saveDocuments(req.files, req.user.id);
    return res.status(201).json({ count: documents.length, documents });
  } catch (err) {
    next(err);
  }
};

const getDocuments = async (req, res, next) => {
  try {
    const documents = await getUserDocuments(req.user.id);
    return res.status(200).json({ count: documents.length, documents });
  } catch (err) {
    next(err);
  }
};

const getDocumentById = async (req, res, next) => {
  try {
    const document = await getUserDocumentById(req.params.id, req.user.id);
    return res.status(200).json({ document });
  } catch (err) {
    next(err);
  }
};



const retryDocument = async(req,res)=>{

 try{

 const result =
 await retryDocumentProcessing(
   req.params.id,
   req.user.id
 );


 res.json(result);


 }catch(err){

 res.status(500).json({
  message:err.message
 });

 }

};


const deleteDocumentController = async(
 req,
 res,
 next
)=>{

 try{

  const result =
  await deleteDocument(
    req.params.id,
    req.user.id
  );


  res.json(result);


 }catch(err){
   next(err);
 }

};



module.exports = { uploadDocuments, getDocuments, getDocumentById, retryDocument, deleteDocumentController };