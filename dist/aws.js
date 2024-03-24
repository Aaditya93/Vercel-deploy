"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = exports.uploadfolder = exports.downloadS3Folder = exports.downloadFolderFromS3 = exports.receiveMessageFromFifoQueue = exports.getMessagesFromSQS = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const AWS = require('aws-sdk');
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const files_1 = require("./files");
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;
const queueUrl = process.env.QUEUE_URL;
const bucketRegion = process.env.BUCKET_REGION;
const bucketName = process.env.BUCKET_NAME;
if (!bucketName || !bucketRegion || !accessKey || !secretAccessKey || !queueUrl) {
    throw new Error("One or more environment variables are undefined.");
}
const sqs = new AWS.SQS({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey,
    },
    region: bucketRegion
});
const numMessages = 1;
const getMessagesFromSQS = () => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        QueueUrl: queueUrl,
        MaxNumberOfMessages: numMessages
    };
    try {
        const data = yield sqs.receiveMessage(params).promise();
        const firstMessage = data.Messages && data.Messages[0];
        const messageBody = firstMessage ? firstMessage.Body : null; // Access the Body property
        return messageBody;
    }
    catch (error) {
        console.error('Error:', error);
        return null;
    }
});
exports.getMessagesFromSQS = getMessagesFromSQS;
function receiveMessageFromFifoQueue() {
    return __awaiter(this, void 0, void 0, function* () {
        const params = {
            QueueUrl: queueUrl,
            MaxNumberOfMessages: 1, // Fetch only one message
            WaitTimeSeconds: 20, // Long polling to reduce the number of empty responses
            AttributeNames: ['MessageGroupId'] // Ensure FIFO order
        };
        try {
            const data = yield sqs.receiveMessage(params).promise();
            if (data.Messages && data.Messages.length > 0) {
                const message = data.Messages[0];
                yield deleteMessageFromQueue(message.ReceiptHandle);
                return message.Body;
            }
            else {
                console.log('No messages available in the queue.');
            }
        }
        catch (error) {
            console.error('Error:', error);
        }
    });
}
exports.receiveMessageFromFifoQueue = receiveMessageFromFifoQueue;
// Function to delete a message from the SQS queue
function deleteMessageFromQueue(receiptHandle) {
    return __awaiter(this, void 0, void 0, function* () {
        const params = {
            QueueUrl: queueUrl,
            ReceiptHandle: receiptHandle
        };
        try {
            yield sqs.deleteMessage(params).promise();
            console.log('Successfully deleted the message from the queue.');
        }
        catch (error) {
            console.error('Error deleting the message:', error);
        }
    });
}
const s3 = new AWS.S3({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey,
    },
    region: bucketRegion
});
function downloadFolderFromS3(bucketName, folderKey, localFolderPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const params = {
            Bucket: bucketName,
            Prefix: `output/${folderKey}`
        };
        try {
            const { Contents } = yield s3.listObjectsV2(params).promise();
            for (const item of Contents) {
                const { Key, Size } = item;
                if (Size > 0) { // Skip directories
                    const localFilePath = path_1.default.join(localFolderPath, Key.replace(`output/${folderKey}`, ''));
                    // Create directory if it doesn't exist
                    const dirName = path_1.default.dirname(localFilePath);
                    if (!fs_1.default.existsSync(dirName)) {
                        fs_1.default.mkdirSync(dirName, { recursive: true });
                    }
                    // Download file
                    const fileParams = {
                        Bucket: bucketName,
                        Key
                    };
                    const fileData = yield s3.getObject(fileParams).promise();
                    // Write file to local disk
                    fs_1.default.writeFileSync(localFilePath, fileData.Body);
                    console.log(`Downloaded ${Key}`);
                }
            }
            console.log('Folder download completed!');
        }
        catch (error) {
            console.error('Error downloading folder from S3:', error);
        }
    });
}
exports.downloadFolderFromS3 = downloadFolderFromS3;
function downloadS3Folder(prefix) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const allFiles = yield s3.listObjectsV2({
            Bucket: bucketName,
            Prefix: prefix
        }).promise();
        // 
        const allPromises = ((_a = allFiles.Contents) === null || _a === void 0 ? void 0 : _a.map(({ Key }) => __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                if (!Key) {
                    resolve("");
                    return;
                }
                const finalOutputPath = path_1.default.join(__dirname, Key);
                const outputFile = fs_1.default.createWriteStream(finalOutputPath);
                const dirName = path_1.default.dirname(finalOutputPath);
                if (!fs_1.default.existsSync(dirName)) {
                    fs_1.default.mkdirSync(dirName, { recursive: true });
                }
                s3.getObject({
                    Bucket: bucketName,
                    Key
                }).createReadStream().pipe(outputFile).on("finish", () => {
                    resolve("");
                });
            }));
        }))) || [];
        console.log("awaiting");
        yield Promise.all(allPromises === null || allPromises === void 0 ? void 0 : allPromises.filter((x) => x !== undefined));
    });
}
exports.downloadS3Folder = downloadS3Folder;
const uploadfolder = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const files = (0, files_1.getAllFiles)(path_1.default.join(__dirname, `output/${id}`));
    files.forEach((file) => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, exports.uploadFile)(file.slice(__dirname.length + 1), file);
    }));
});
exports.uploadfolder = uploadfolder;
const uploadFile = (fileName, localFilePath) => __awaiter(void 0, void 0, void 0, function* () {
    const fileContent = fs_1.default.readFileSync(localFilePath);
    const response = yield s3.upload({
        Body: fileContent,
        Bucket: bucketName,
        Key: fileName,
    }).promise();
    console.log(response);
});
exports.uploadFile = uploadFile;
