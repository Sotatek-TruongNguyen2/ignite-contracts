import { solidityKeccak256 } from "ethers/lib/utils"

function calculateErrorSelector(customError: string){
    console.log(solidityKeccak256(['string'],[customError]).slice(2,10))
}

calculateErrorSelector("CustomError1(uint256)")