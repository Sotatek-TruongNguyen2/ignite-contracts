import { BigNumber } from "ethers";

function main(price: number, IDODecimal: number, purchaseDecimal: number){
    const MAX_DEX_LENGTH = 18
    const invert = 1/price
    let dex: number = invert.toString().split('.')[1].length
    dex = dex > MAX_DEX_LENGTH ? MAX_DEX_LENGTH : dex
    let intergralPartLength = invert.toString().split('.')[0].length
    const ratex: string = invert.toString().replace('.','').slice(0, intergralPartLength + dex)

    let rate: BigNumber;
    let de: number;
    if(IDODecimal < purchaseDecimal){
        rate = BigNumber.from(ratex);
        de = dex + purchaseDecimal - IDODecimal
    }else{
        de = dex
        rate = BigNumber.from(ratex).mul(BigNumber.from(10).pow(IDODecimal - purchaseDecimal))
    }
    return {rate, de}
}

const {rate, de} = main(55, 8, 6);
console.log(rate, de)
console.log(rate.toString(), de)



// console.log("123456789".slice(0,5))