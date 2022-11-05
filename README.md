# Calculate rate and decimal variable in Pool contract

We have price of 1 IDO Token is x Purchase Token (like: USDT, USDC, BUSD,...)

For short, we will call IDO Token is **Itoken**, Purchase Token is **Ptoken**.

We also call the minimum basic unit of Itoken and Ptoken is **wItoken** and **wPtoken** respectively.

We will call decimal of IDO Token and Purchase Token is **Ide** and **Pde** respectively.

>> 1 (IDO Token) = x (Purchase Token)

>> 1 (Itoken) = x (Ptoken)

>> 10^Ide (wItoken) = x*10^Pde (wPtoken)

>> 1 (wItoken) = x*10^(Pde-Ide) (wPtoken)

With {amount} of wPtoken, we will receive:

>> amount / (x*10^(Pde-Ide)) (wItoken) = amount (wPtoken)

Now, reverse for more easy when reading:

amount (wPtoken) = amount / (x * 10^(Pde-Ide)) (wItoken) = amount * 10^(Ide-Pde) / x (wItoken)

But in Solidity, we can not use float number, so if x = 0.005 or Ide < Pde, x and 10^(Ide-Pde) will equal 0.

>> So we need to store price of IDO token (x) in another way and process in case decimal of IDO Token smaller than one of Purchase Token.

## First, process value of x:

- If x<1 like x = 0.8 = 1/1.25 = 10^2 / 125, then we call store 1 and 125 in contract and then calculate x by x = 10^2 / 125

>> Let call 125 and 2 in this case are **rate and decimal of x**. For short, we will call them are **ratex** and **dex**, so we have:

>> x = 0.8 = 10^2 / 125 = 10^(dex) / ratex

>> ratex = 10^(dex) / x

>> Let see 1/0.8 = 1.25, we can not store 1.25 in contract, so {dex} will help us.

>> Let count the decimal digit of 1.25 >> There are 2 digits in decimal part of this number 

>> So we have {dex} >= 2, rate will be an Integer number, not a float number (like 12.5 or 1.25)

>> We will set {dex} = 2 and then rate = 1.25 * 10^2 = 125. Then we will store {ratex = 125} and {dex = 2} in contract to display the value of x = 10^2 / 125 = 0.8


- If x>=1 like x = 80, so we have rate = 10^(dex) / 80 = 1/80 * 10^(dex) = 0.0125 * 10^(dex)

>> We will store rate in contract, so we need rate is not a float number like 0.0125 >> So {dex} will help us.

>> Let count the decimal digit of 0.0125 >> There are 4 digits in decimal part of this number 

>> So we have {dex} >= 4, rate will be an Integer number, not a float number (like 12.5 or 1.25)

>> We will set {dex} = 4 and then rate = 0.0125 * 10^4 = 125. Then we will store {ratex = 125} and {dex = 4} in contract to display the value of x = 10^4 / 125 = 80


- **Summary, dex = {the number digit of decimal part of 1/x}, ratex = 1/x*10^(dex)**


- Special case, if 1/x is an irrational number like x = 0.3 >> 1/x = 3.333333333333... or x = 28 => 1/x = 0.0357142857...

>> We need to increase  or limit value of {dex}.

>> Example with x < 1: x = 0.3 >> 1/x = 3.333333... >> dex is infinity

>> So we can set dex = 18 and ratex = 3_333333_333333_333333, so we {ratex} and {dex} in contract will be {3_333333_333333_333333} and {18} (not absolutely accurate but minimize error in calculation)

>> Example with x >= 1: x=28 >> 1/x = 0.0357142857142857142857142857142857142857... >> dex is infinity

>> So we can set dex = 18 and ratex = 35714285714285714, those will be store in contract to display x = 28

## Second, process with Ide - Pde:

>> Now we have formula to calculate amount of IDO token without x:

amount (wPtoken) = amount * 10^(Ide-Pde) / x (wItoken) = amount * 10^(Ide-Pde) * ratex / 10^(dex) (wItoken) **(*)**

- If Ide < Pde, we can write reverse formula like this: amount (wPtoken) = amount * ratex / 10 ^ (dex + Pde - Ide) (wItoken).

>> Pde - Ide > 0, so we can increase {dex} an amount is {Pde-Ide} in contract. 

>> Let call result of dex+Pde-Ide is **final decimal** or **de** for short.

>> amount (wPtoken) = amount * ratex / 10 ^ de (wItoken). **(**)**

- If Ide >= Pde, we have Pde-Ide < 0, so we consider de = dex, then compare **(*)** and **(**)**, we can declare new {rate} variable:

>> rate = 10^(Ide-Pde) * ratex 

>> amount (wPtoken) = amount * rate / 10 ^(dex) (wItoken)

>> And now instead storing value of ratex and dex in contract, we will display price of IDO token (x) by {de} and {rate} value**

- **Summary, if Ide < Pde, rate = ratex, de = dex+Pde-Ide and if Ide >= Pde, rate = ratex*10^(Ide-Pde), de = dex**

### Conclude and example:

- To display in contract the price of IDO token (x), which is set by user and with meaning 1 IDO token = x Purchase token. Developer need to calculate some value and store in contract, which is called **rate** and **decimal** variable.

- dex = {the number digit of decimal part of 1/x}, ratex = 1/x*10^(dex) 
(with 1/x is irrational number, dex = 18)

- If Ide < Pde, rate = ratex, de = dex+Pde-Ide **OR** if Ide >= Pde, rate = ratex*10^(Ide-Pde), de = dex

Example:

- x = 0.08, Ide = 18, Pde = 6 >> 1/x = 12.5 >> dex = 1 >> ratex = 125 >> rate = 125*10^12 >> de = 1

- x = 0.028, Ide = 6, Pde = 8 >> 1/x = 35.7142857143... >> dex = 18 >> ratex = 35_714285_714285_714285 >> rate = 35_714285_714285_714285 >> de = 20

- x = 10, Ide = 10, Pde = 18 >> 1/x = 0.1 >> dex = 1 >> ratex = 1 >> rate = 1 >> dex = 9

- x = 55, Ide = 8, Pde = 6 >> 1/x = 0.01818181818... >> dex = 18 >> ratex = 18181818181818181 >> rate = 1818181818181818100 >> de = 18
