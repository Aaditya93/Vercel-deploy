"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_1 = require("./aws");
setInterval(() => {
    let id = (0, aws_1.receiveMessageFromFifoQueue)();
    (0, aws_1.downloadS3Folder)(`output/${id}`);
}, 10000);
// downloadS3Folder("output/2eief")
