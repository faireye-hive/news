const fs = require('fs');

let file = fs.readFileSync('components/MarketPools.tsx', 'utf-8');

file = file.replace(/import { useAuth } from '\.\.\/contexts\/AuthContext';/, "import { useAuth } from '../contexts/AuthContext';\nimport { useLanguage } from '../contexts/LanguageContext';");

file = file.replace(/const { user, customJson } = useAuth\(\);/, "const { user, customJson } = useAuth();\n  const { t } = useLanguage();");

// Replace strings
const replacements = [
  ['Pools de Liquidez', '{t("pools.title")}'],
  ['Transacione instantaneamente ou adicione liquidez para ganhar taxas na pool do', '{t("pools.subtitle")}'],
  ['Atualizando...', '{t("pools.refreshing")}'],
  ['Atualizar Dados', '{t("pools.refresh")}'],
  ['Nenhuma pool de liquidez encontrada para', '{t("pools.noPools")}'],
  ['Pools Disponíveis', '{t("pools.availablePools")}'],
  ['Seus Saldos (Hive Engine)', '{t("pools.yourBalances")}'],
  ['Swap (Trocar)', '{t("pools.swapTab")}'],
  ['Prover Liquidez', '{t("pools.addTab")}'],
  ['Retirar Liquidez', '{t("pools.removeTab")}'],
  ['Estatísticas', '{t("pools.overviewTab")}'],
  ['De (Vender)', '{t("pools.from")}'],
  ['Para (Comprar - Estimado)', '{t("pools.to")}'],
  ['Tolerância de Deslizamento', '{t("pools.slippage")}'],
  ['Taxa do Swap (0.25%)', '{t("pools.swapFee")}'],
  ['Retorno Mínimo Seguro', '{t("pools.minReturn")}'],
  ['Impacto no Preço', '{t("pools.priceImpact")}'],
  ['Preço Unitário Estimado', '{t("pools.estimatedPrice")}'],
  ['Processando Swap...', '{t("pools.processingSwap")}'],
  ['Conecte-se para fazer Swap', '{t("pools.loginToSwap")}'],
  ['Saldo de ${swapFrom} Insuficiente', '`${t("pools.insufficientBalance").replace("{token}", swapFrom)}`'],
  ['Executar Swap', '{t("pools.executeSwap")}'],
  ['*Operação realizada na Hive Engine via Keychain. Certifique-se de assinar com sua chave ativa.', '{t("pools.disclaimer")}'],
  ['Ao prover liquidez, você deve adicionar os dois ativos da pool na proporção correta de mercado. Em troca, você recebe tokens de participação (Shares) que representam sua parcela na pool e ganha taxas geradas por traders.', '{t("pools.addLiquidityInfo")}'],
  ['Adicionar', '{t("pools.addToken")}'],
  ['(Calculado)', '{t("pools.calculated")}'],
  ['Proporção de Mercado', '{t("pools.marketRatio")}'],
  ['Processando Adição...', '{t("pools.processingAdd")}'],
  ['Adicionar Liquidez', '{t("pools.addLiquidity")}'],
  ['Sem participação nesta pool', '{t("pools.noSharesTitle")}'],
  ['Você não possui tokens LP (Shares) no par ${selectedPool.tokenPair}. Adicione liquidez para ver opções de retirada.', '{t("pools.noSharesDesc").replace("{pair}", selectedPool.tokenPair)}'],
  ['Seu Saldo LP (Shares)', '{t("pools.yourLpBalance")}'],
  ['Sua Parcela na Pool', '{t("pools.yourPoolShare")}'],
  ['Valores resgatáveis aproximados:', '{t("pools.approxValues")}'],
  ['Percentual de Retirada', '{t("pools.removePercentage")}'],
  ['MÁXIMO', '{t("pools.max")}'],
  ['Retirada parcial estimada:', '{t("pools.partialEstimate")}'],
  ['Processando Retirada...', '{t("pools.processingRemove")}'],
  ['Remover Liquidez', '{t("pools.removeLiquidity")}']
];

for (const [search, replace] of replacements) {
  // Try to replace JSX strings first
  const jsxSearch = `>${search}<`;
  const jsxReplace = `>${replace}<`;
  if (file.includes(jsxSearch)) {
    file = file.replaceAll(jsxSearch, jsxReplace);
  }
  // Try to replace text nodes like: <span>Search</span>
  
  // Also try replacing raw strings
  file = file.replaceAll(`"${search}"`, replace.startsWith("`") ? replace : `"${replace}"`);
  file = file.replaceAll(`'${search}'`, replace.startsWith("`") ? replace : `'${replace}'`);
  
  // Specific replacements
  if (search === 'Nenhuma pool de liquidez encontrada para') {
    file = file.replace(/Nenhuma pool de liquidez encontrada para/, '{t("pools.noPools")}');
  }
  if (search === 'Transacione instantaneamente ou adicione liquidez para ganhar taxas na pool do') {
    file = file.replace(/Transacione instantaneamente ou adicione liquidez para ganhar taxas na pool do/, '{t("pools.subtitle")}');
  }
  if (search === 'Você não possui tokens LP (Shares) no par ${selectedPool.tokenPair}. Adicione liquidez para ver opções de retirada.') {
    file = file.replace(/Você não possui tokens LP \(Shares\) no par \{selectedPool\.tokenPair\}\. Adicione liquidez para ver opções de retirada\./, '{t("pools.noSharesDesc").replace("{pair}", selectedPool.tokenPair)}');
  }
  if (search === 'Saldo de ${swapFrom} Insuficiente') {
    file = file.replace(/`Saldo de \$\{swapFrom\} Insuficiente`/, '`${t("pools.insufficientBalance").replace("{token}", swapFrom)}`');
  }
  
  if (search === 'Atualizando...' || search === 'Atualizar Dados' || search === 'Executar Swap') {
    file = file.replaceAll(`'${search}'`, replace);
  }
}

// Few manual fixes
file = file.replace(/>Adicionar \{selectedPool\.tokenPair\.split\(':'\)\[0\]\}</g, ">{t('pools.addToken')} {selectedPool.tokenPair.split(':')[0]}<");
file = file.replace(/>Adicionar \{selectedPool\.tokenPair\.split\(':'\)\[1\]\} \{t\("pools\.calculated"\)\}</g, ">{t('pools.addToken')} {selectedPool.tokenPair.split(':')[1]} {t('pools.calculated')}<");
file = file.replace(/\{actionLoading \? 'Processando Swap\.\.\.' : \n.*?\(!user \? 'Conecte-se para fazer Swap'/g, "{actionLoading ? t('pools.processingSwap') : \n                                 (!user ? t('pools.loginToSwap')");

file = file.replace(/`Executar Swap \(\$\{swapFrom\} → \$\{swapTo\}\)`\)\}/, '`${t("pools.executeSwap")} (${swapFrom} → ${swapTo})`)}');

file = file.replace(/\{actionLoading \? 'Processando Adição\.\.\.' : 'Adicionar Liquidez'\}/, "{actionLoading ? t('pools.processingAdd') : t('pools.addLiquidity')}");


fs.writeFileSync('components/MarketPools.tsx', file);
