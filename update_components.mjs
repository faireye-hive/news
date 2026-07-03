import fs from 'fs';

let file = fs.readFileSync('components/MarketPools.tsx', 'utf-8');

file = file.replace(/"Transação enviada com sucesso! Atualizando saldos em alguns segundos..."/g, "t('pools.successSwap')");
file = file.replace(/"Por favor, faça login para adicionar liquidez."/g, "t('pools.loginToAdd')");
file = file.replace(/"Erro ao adicionar liquidez: " \+ res\.msg/g, "t('pools.errorAdd') + res.msg");
file = file.replace(/"Por favor, faça login para remover liquidez."/g, "t('pools.loginToRemove')");
file = file.replace(/"Erro ao remover liquidez: " \+ res\.msg/g, "t('pools.errorRemove') + res.msg");

file = file.replace(/`Saldo insuficiente de \$\{swapFrom\}\. Você possui \$\{balanceAvailable\}\.`/g, "t('pools.insufficientBalanceExt', { token: swapFrom, balance: balanceAvailable })");
file = file.replace(/`Saldo insuficiente de \$\{tokenA\}\.`/g, "t('pools.insufficientBalance', { token: tokenA })");
file = file.replace(/`Saldo insuficiente de \$\{tokenB\}\.`/g, "t('pools.insufficientBalance', { token: tokenB })");

file = file.replace(/<span>Sua fatia: \{userShare\.proportion\}<\/span>/g, "<span>{t('pools.yourShareText')} {userShare.proportion}</span>");
file = file.replace(/<span>Minha Liquidez<\/span>/g, "<span>{t('pools.myLiquidity')}</span>");

file = file.replace(/<Sliders size=\{13\} \/> Tolerância de Deslizamento/g, "<Sliders size={13} /> {t('pools.slippage')}");

file = file.replace(/\*Operação realizada na Hive Engine via Keychain\. Certifique-se de assinar com sua chave ativa\./g, "{t('pools.disclaimer')}");
file = file.replace(/Ao prover liquidez, você deve adicionar os dois ativos da pool na proporção correta de mercado\. Em troca, você recebe tokens de participação \(Shares\) que representam sua parcela na pool e ganha taxas geradas por traders\./g, "{t('pools.addLiquidityInfo')}");

file = file.replace(/>Reserva de /g, ">{t('pools.reserveOf')} ");
file = file.replace(/Indicadores de Preço/g, "{t('pools.priceIndicators')}");
file = file.replace(/Informações Adicionais/g, "{t('pools.additionalInfo')}");
file = file.replace(/Total de Quotas \(Pool Shares\)/g, "{t('pools.totalSharesInfo')}");
file = file.replace(/Provedores de Liquidez/g, "{t('pools.liquidityProviders')}");

file = file.replace(/Mostrando todos os \{poolHolders\.length\} provedores desta pool\./g, "{t('pools.showingAllProviders', { count: poolHolders.length })}");

file = file.replace(/`Remover \$\{removePercent\}% de Liquidez`/g, "t('pools.removePercent', { percent: removePercent })");

file = file.replace(/Saldo:/g, "{t('pools.balance')}");
file = file.replace(/title="Atualizar Saldos"/g, "title={t('pools.refreshBalances')}");

fs.writeFileSync('components/MarketPools.tsx', file);
