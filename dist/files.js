"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllFiles = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const getAllFiles = (folderPath) => {
    let repsonse = [];
    const AllFilesAndFolders = fs_1.default.readdirSync(folderPath);
    AllFilesAndFolders.forEach(file => {
        const fullPath = path_1.default.join(folderPath, file);
        if (fs_1.default.statSync(fullPath).isDirectory()) {
            repsonse = repsonse.concat((0, exports.getAllFiles)(fullPath));
        }
        else {
            repsonse.push(fullPath);
        }
    });
    return repsonse;
};
exports.getAllFiles = getAllFiles;
