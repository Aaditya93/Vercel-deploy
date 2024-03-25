import { receiveMessageFromFifoQueue,downloadS3Folder,uploadFile } from "./aws";
import { buildProject } from "./utils";
import { getAllFiles } from "./files";
import path from "path";

async function main() {
  while (true) {
    const message = await receiveMessageFromFifoQueue()
    if (message) {
      console.log(message)
      await downloadS3Folder(`output/${message}`)
      await buildProject(message)
      const  files = getAllFiles(path.join(__dirname,`output/${message}`)); 
      files.forEach(async file => {
          await uploadFile(file.slice(__dirname.length + 1), file);
      })
      }
      console.log("done")
  }
}
main()


// downloadS3Folder("output/2eief")

