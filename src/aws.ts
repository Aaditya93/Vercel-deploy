
import dotenv from "dotenv"
dotenv.config();
const AWS = require('aws-sdk');
import fs from 'fs';
import path from 'path';
import { getAllFiles } from "./files";
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY
const queueUrl = process.env.QUEUE_URL
const bucketRegion = process.env.BUCKET_REGION
const bucketName = process.env.BUCKET_NAME


if (!bucketName || !bucketRegion || !accessKey || !secretAccessKey || !queueUrl) {
    throw new Error("One or more environment variables are undefined.");
}

const sqs = new AWS.SQS({
    credentials:{
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey,

    },
    region: bucketRegion

});

const numMessages = 1;

export const getMessagesFromSQS =async()  => {
    const params = {
        QueueUrl: queueUrl,
        MaxNumberOfMessages: numMessages
      };
    
      try {
        const data = await sqs.receiveMessage(params).promise();
        const firstMessage = data.Messages && data.Messages[0]; 
        const messageBody = firstMessage ? firstMessage.Body : null; // Access the Body property
        return messageBody;
      } catch (error) {
        console.error('Error:', error);
        return null;
    }
}
    


export async function receiveMessageFromFifoQueue() {
    const params = {
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 1, // Fetch only one message
      WaitTimeSeconds: 20, // Long polling to reduce the number of empty responses
      AttributeNames: ['MessageGroupId'] // Ensure FIFO order
    };
  
    try {
      const data = await sqs.receiveMessage(params).promise();
  
      if (data.Messages && data.Messages.length > 0) {
        const message = data.Messages[0];
        await deleteMessageFromQueue( message.ReceiptHandle);
        return message.Body;
      } else {
        console.log('No messages available in the queue.');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  // Function to delete a message from the SQS queue
  async function deleteMessageFromQueue(receiptHandle:string):  Promise<void> {
    const params = {
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle
    };
  
    try {
      await sqs.deleteMessage(params).promise();
      console.log('Successfully deleted the message from the queue.');
    } catch (error) {
      console.error('Error deleting the message:', error);
    }
  }
  
  
  const s3 = new AWS.S3({
    credentials:{
      accessKeyId: accessKey,
      secretAccessKey: secretAccessKey,

  },
  region: bucketRegion
  });


export async function downloadFolderFromS3(bucketName:string, folderKey:string, localFolderPath:string) {
    const params = {
      Bucket: bucketName,
      Prefix: `output/${folderKey}`
    };
  
    try {
      const { Contents } = await s3.listObjectsV2(params).promise();

  
      for (const item of Contents) {
        const { Key, Size } = item;
        if (Size > 0) { // Skip directories
         
          const localFilePath = path.join(localFolderPath, Key.replace(`output/${folderKey}`, ''));
          // Create directory if it doesn't exist
          const dirName = path.dirname(localFilePath);
          if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName, { recursive: true });
          }
  
          // Download file
          const fileParams = {
            Bucket: bucketName,
            Key
          };
          const fileData = await s3.getObject(fileParams).promise();
  
          // Write file to local disk
          fs.writeFileSync(localFilePath, fileData.Body);
          console.log(`Downloaded ${Key}`);
        }
      }
  
      console.log('Folder download completed!');
    } catch (error) {
      console.error('Error downloading folder from S3:', error);
    }
  }

  
  export async function downloadS3Folder(prefix: string) {
    const allFiles = await s3.listObjectsV2({
        Bucket: bucketName,
        Prefix: prefix
    }).promise();
    
    // 
    const allPromises = allFiles.Contents?.map(async ({Key}: {Key: string}) => {
        return new Promise(async (resolve) => {
            if (!Key) {
                resolve("");
                return;
            }
            const finalOutputPath = path.join(__dirname, Key);
            const outputFile = fs.createWriteStream(finalOutputPath);
            const dirName = path.dirname(finalOutputPath);
            if (!fs.existsSync(dirName)){
                fs.mkdirSync(dirName, { recursive: true });
            }
            s3.getObject({
                Bucket: bucketName,
                Key
            }).createReadStream().pipe(outputFile).on("finish", () => {
                resolve("");
            })
        })
    }) || []
    console.log("awaiting");

    await Promise.all<Promise<void>>(allPromises?.filter((x: Promise<void> | undefined): x is Promise<void> => x !== undefined));
}

export const uploadfolder = async (id: string) => {
  const  files = getAllFiles(path.join(__dirname,`output/${id}`)); 
    files.forEach(async file => {
        await uploadFile(file.slice(__dirname.length + 1), file);
    })

}

export const uploadFile = async (fileName: string, localFilePath: string) => {
  const updatedFileName = fileName.replace("output/", "dist/");
  console.log(updatedFileName, localFilePath)
  const fileContent = fs.readFileSync(localFilePath);
  const response = await s3.upload({
      Body: fileContent,
      Bucket: bucketName,
      Key: updatedFileName,
  }).promise();

}