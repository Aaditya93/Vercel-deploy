import { receiveMessageFromFifoQueue,downloadS3Folder } from "./aws";

 setInterval(() => {
  let id  = receiveMessageFromFifoQueue();
    downloadS3Folder(`output/${id}`)
}, 10000);


// downloadS3Folder("output/2eief")