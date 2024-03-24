import fs from "fs";
import path from "path";

export const getAllFiles  =(folderPath:string):string[]=>{
    let repsonse:string[]= [];

    const AllFilesAndFolders = fs.readdirSync(folderPath);AllFilesAndFolders.forEach(file =>{
        const fullPath = path.join(folderPath, file);
        if(fs.statSync(fullPath).isDirectory()){
            repsonse = repsonse.concat(getAllFiles(fullPath));
        }
        else{ repsonse.push(fullPath); }
    });
    return repsonse;
}