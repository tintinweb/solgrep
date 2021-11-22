[<img width="200" alt="get in touch with Consensys Diligence" src="https://user-images.githubusercontent.com/2865694/56826101-91dcf380-685b-11e9-937c-af49c2510aa0.png">](https://diligence.consensys.net)<br/>
<sup>
[[  🌐  ](https://diligence.consensys.net)  [  📩  ](https://github.com/ConsenSys/vscode-solidity-doppelganger/blob/master/mailto:diligence@consensys.net)  [  🔥  ](https://consensys.github.io/diligence/)]
</sup><br/><br/>


## SolGrep - A scriptable semantic grep for solidity

So you have a set of smart contracts and want to find all contracts that have a `public` method named `withdrawEth` but lexical grep yields a lot of false-positives? Here's where [solgrep](https://github.com/tintinweb/solgrep) can help! 🙌

[💾](https://www.npmjs.com/package/solgrep) `npm install -g solgrep` 

Solgrep recursively finds smart contracts in a target directory, parses the source units to understand the language semantics, and makes this information available to a powerful javascript-based filter function. This way, you can:

* extract semantic information from solidity source code based on custom filter functions
* find target contracts based on a custom filter script you define
* create & run your own or built-in rules (e.g. for CI checks)
* crunch numbers and generate statistics from a code base

Probably the most common way to use this tool is to run it with the `--find=<js-filter-statement>` option, where `js-filter-statement` is a javascript one-liner that tells the engine what you are interested in. You either provide a statement that returns `boolean` ("find mode") or return information you want to extract ("extract mode").

![solgrep2](https://user-images.githubusercontent.com/2865694/142903238-af9d2d11-81bb-430c-96dc-4118da89c90b.gif)

⚠️ Make sure to only allow trusted inputs to `--find=<js-filter-statement>` as this argument is being evaluated as javascript!

### Examples

You want to find all source-units with a contract that has a function named `withdrawEth`? 👉 

```javascript
⇒  solgrep  <folder> --find="function.name=='withdrawEth'" 
```

Do the same thing but case-insensitive? 👉 

```javascript
⇒  solgrep <folder> --find="function.name.toLowerCase()=='withdraweth'" 
```

Exctract all function names from all contracts? 👉 

```javascript
⇒  solgrep <folder> --find="function.name" 
```

Get a list of all `external` functions? 👉 

```javascript
⇒  solgrep <folder> --find="function.visibility.includes('external')"  
```

Find `ERC777` contracts? 👉

```javascript
⇒  solgrep <folder> --find="contract.name=='ERC777'" 
```

Extract all Contract names? 👉

```javascript
⇒  solgrep <folder> --find="contract.name"
```

Match against something in the `AST`? 👉

```javascript
⇒  solgrep <folder> --find="contract.ast...."
```

Lexial match a functions source code?  👉

```javascript
⇒  solgrep <folder> --find="function.getSource().includes('hi')"
```


Use option `--output=<output.json>` to write all results to a file.

### Built-In Keywords for `--find`

* The `sourceUnit` object matches the source-file the engine is currently processing.
* The `contract` object matches the contract the engine is currently processing.
* The `function` object matches the function the engine is currently processing.

#### Available Methos

The following methods are available:

* `<sourceUnit|contract|function>.getSource()` - provides access to the units source code
* `<sourceUnit|contract|function>.ast` - provides direct access to the [solidity-parser](https://github.com/solidity-parser/parser) AST
* There's even more information available. Go check out the Solidity SourceUnit/Contract/Function [Wrapper Classes](https://github.com/tintinweb/solgrep/blob/master/src/solidity.js#L18) functionality (attribs/functions).


#### Special Functions

Special contract functions can be references as:

*  `function.name == '__fallback__'`
*  `function.name == '__receiveEther__'`
*  `function.name == '__constructor__'`





### Built-In Rules

* `Stats` - collects stats about how many files, contracts, unique names, etc. were processed
* `GenericGrep` - is the engine behind the `--find` feature
* ...

## Demo

Here's an example that illustrates how to extract all function names from all `sourceUnits` and `contracts`.


```javascript
⇒  solgrep smart-contract-sanctuary/contracts_arbiscan/mainnet/d6 --find="function.name" 
🧠 SolGrep v0.0.1 starting ...


  📁 smart-contract-sanctuary/contracts_arbiscan/mainnet/d6
 ████████████████████████████████████████ 100% | ETA: 0s | 5/5
 [🔥] smart-contract-sanctuary/contracts_arbiscan/mainnet/d6/d68970e266ce1a015953897c7055a5e0bc657af8_Vyper_contract.sol: The specified node does not exist
   ──────────────────────────── Results
{
  'smart-contract-sanctuary/contracts_arbiscan/mainnet/d6/d60514536195573ce4a4a78ce5706e94e9ee7917_StrategySushiEthMimLp.sol': [
    {
      rule: 'GenericGrep',
      tag: 'match-function: SafeMath.add',
      info: 'add'
    },
    {
      rule: 'GenericGrep',
      tag: 'match-function: SafeMath.sub',
      info: 'sub'
    },
...
```

#### Run default Rulesets

If you provide no configuration options it will take the default built-in grep rules and crunch numbers using the `stats` module.


```javascript
⇒  solgrep smart-contract-sanctuary/contracts_arbiscan/mainnet/d6 
🧠 SolGrep v0.0.1 starting ...


  📁 smart-contract-sanctuary/contracts_arbiscan/mainnet/d6
 ████████████████████████████████████████ 100% | ETA: 0s | 5/5

   ──────────────────────────── Results
{
  'smart-contract-sanctuary/contracts_arbiscan/mainnet/d6/d60a598998ed27a7C54315F2675908B628E434B1_LiquidityPool.sol': [
    {
      rule: 'IsInitializable',
      tag: 'INITIALIZEABLE',
      info: 'initialize - public initialize function; likely proxy'
    },
    {
      rule: 'IsInitializable',
      tag: 'INITIALIZEABLE',
      info: 'initialize - public initialize function; likely proxy'
    }
  ],
  'smart-contract-sanctuary/contracts_arbiscan/mainnet/d6/d64E77C7C6A1dcC7e302F8fe31A22745e223c39c_MyStrategy.sol': [
    {
      rule: 'IsInitializable',
      tag: 'INITIALIZEABLE',
      info: 'initialize - public initialize function; likely proxy'
    }
  ],
  undefined: [ { rule: 'Stats', tag: 'STATS', info: [Object] } ]
}
   ────────────────────────────
{
  sourceUnits: 4,
  contracts: {
    total: 13,
    names: {
      ERC20: 1,
      StrategySushiEthMimLp: 1,
      LiquidityPool: 1,
      Getter: 1,
      Governance: 1,
      LibraryEvents: 1,
      Perpetual: 1,
      Storage: 1,
      ArbiBoneman: 1,
      ERC721: 1,
      MyStrategy: 1,
      PausableUpgradeable: 1,
      SettAccessControl: 1
    }
  },
  interfaces: {
    total: 39,
    names: {
      IERC20: 1,
      IJar: 1,
      IStakingRewards: 1,
      IStakingRewardsFactory: 1,
      IMasterchef: 1,
      UniswapRouterV2: 1,
      IUniswapV2Pair: 1,
      IUniswapV2Factory: 1,
      IRewarder: 1,
      IMiniChefV2: 1,
      ILiquidityPool: 1,
      IOracle: 1,
      IAccessControl: 1,
      IGovernor: 1,
      IPoolCreatorFull: 1,
      ISymbolService: 1,
      IPoolCreator: 1,
      ITracer: 1,
      IVersionControl: 1,
      IVariables: 1,
      IKeeperWhitelist: 1,
      IProxyAdmin: 1,
      IDecimals: 1,
      ILiquidityPoolGetter: 1,
      ILiquidityPoolGovernance: 1,
      IPerpetual: 1,
      IERC721Enumerable: 1,
      IERC721: 1,
      IERC721Receiver: 1,
      IERC721Metadata: 1,
      IERC165: 1,
      ICurveGauge: 1,
      ICurveStableSwapREN: 1,
      IUniswapRouterV2: 1,
      IStrategy: 1,
      IController: 2,
      IERC20Upgradeable: 2
    }
  },
  libraries: {
    total: 31,
    names: {
      SafeMath: 1,
      SafeERC20: 1,
      BoringERC20: 1,
      EnumerableSetUpgradeable: 1,
      SafeCastUpgradeable: 1,
      AMMModule: 1,
      LiquidityPoolModule: 1,
      PerpetualModule: 1,
      SignedSafeMathUpgradeable: 1,
      Constant: 1,
      Math: 1,
      SafeMathExt: 1,
      Utils: 1,
      MarginAccountModule: 1,
      EnumerableSet: 1,
      OrderData: 1,
      CollateralModule: 1,
      TradeModule: 1,
      OrderModule: 1,
      Signature: 1,
      ECDSAUpgradeable: 1,
      Strings: 1,
      MathUpgradeable: 1,
      Address: 2,
      SafeMathUpgradeable: 2,
      AddressUpgradeable: 2,
      SafeERC20Upgradeable: 2
    }
  },
  abstract: {
    total: 13,
    names: {
      StrategyBase: 1,
      StrategySushiFarmBase: 1,
      ReentrancyGuardUpgradeable: 1,
      ERC721Enumerable: 1,
      Ownable: 1,
      ERC165: 1,
      BaseStrategy: 1,
      Context: 2,
      ContextUpgradeable: 2,
      Initializable: 2
    }
  }
}
TOTAL FILES: 5
ERRORS: 1
   ────────────────────────────



cheers 🙌 
    @tintinweb 
    ConsenSys Diligence @ https://consensys.net/diligence/
    https://github.com/tintinweb/solgrep/ 

```


### Usage

```javascript

⇒  solgrep --help
Usage: solgrep [options] <folder|...>

Options:
  -r, --rule        Enable rules                           [array] [default: []]
  -l, --list-rules  List available rules              [boolean] [default: false]
  -f, --find        Find/Extract information using custom pattern
                                                           [array] [default: []]
  -o, --output      Write "results" as JSON to output file path.        [string]
  -h, --help        Show help                                          [boolean]
  -v, --version     Show version number                                [boolean]

  ```


## Library 

```javascript
const solgrep = require('solgrep');

let sg = new SolGrep('::memory::', rules, callbacks);
sg.analyzeDir("/path/to/smart/contracts").then(() => {
    console.log("   ──────────────────────────── Results")
    console.log(sg.results)
    console.log("   ────────────────────────────")
    sgrep.close();
})


```
