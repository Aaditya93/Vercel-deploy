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
const aws_1 = require("./aws");
const utils_1 = require("./utils");
const files_1 = require("./files");
const path_1 = __importDefault(require("path"));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        while (true) {
            const message = yield (0, aws_1.receiveMessageFromFifoQueue)();
            if (message) {
                console.log(message);
                yield (0, aws_1.downloadS3Folder)(`output/${message}`);
                yield (0, utils_1.buildProject)(message);
                const files = (0, files_1.getAllFiles)(path_1.default.join(__dirname, `output/${message}`));
                files.forEach((file) => __awaiter(this, void 0, void 0, function* () {
                    yield (0, aws_1.uploadFile)(file.slice(__dirname.length + 1), file);
                }));
            }
        }
    });
}
main();
// downloadS3Folder("output/2eief")
