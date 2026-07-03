import fs from 'fs';

let profileCode = fs.readFileSync('components/Profile.tsx', 'utf-8');
if(!profileCode.includes('useLanguage')) {
    profileCode = profileCode.replace(/import \{ useCommunity \} from '\.\.\/contexts\/CommunityContext';/, "import { useCommunity } from '../contexts/CommunityContext';\nimport { useLanguage } from '../contexts/LanguageContext';");
    profileCode = profileCode.replace(/const \{ username \} = useParams<\(\{ username: string \}\)>\(\);/, "const { username } = useParams<{ username: string }>();\n  const { t } = useLanguage();");
    
    // Auth errors / alerts
    profileCode = profileCode.replace(/'Faça login para seguir'/, "t('profile.loginToFollow')");
    profileCode = profileCode.replace(/'Deixar de Seguir' : 'Seguir Usuário'/, "t('profile.unfollow') : t('profile.follow')");
    profileCode = profileCode.replace(/"Erro: " \+ res\.msg/g, "t('profile.error') + res.msg");
    profileCode = profileCode.replace(/'Faça login para mutar'/, "t('profile.loginToMute')");
    profileCode = profileCode.replace(/'Desmutar Usuário' : 'Mutar Usuário'/, "t('profile.unmute') : t('profile.mute')");
    profileCode = profileCode.replace(/"Faça login para votar!"/, "t('profile.loginToVote')");
    profileCode = profileCode.replace(/"Você já votou neste post\."/, "t('profile.alreadyVoted')");
    profileCode = profileCode.replace(/"Erro ao votar: " \+ result\.msg/, "t('profile.errorVote') + result.msg");
    
    // Headers
    profileCode = profileCode.replace(/>Login Necessário</, ">{t('profile.loginRequired')}<");
    profileCode = profileCode.replace(/Faça login para visualizar seu perfil nas comunidades da Hive\./, "{t('profile.loginDesc')}");
    profileCode = profileCode.replace(/Perfil na comunidade <span/, "{t('profile.profileIn')} <span");
    profileCode = profileCode.replace(/% Power em /, "% {t('profile.powerIn')} ");
    
    // Buttons
    profileCode = profileCode.replace(/\{isFollowing \? 'Deixar de Seguir' : 'Seguir'\}/, "{isFollowing ? t('profile.unfollow') : t('profile.follow')}");
    profileCode = profileCode.replace(/\{isMuted \? 'Desmutar' : 'Mutar'\}/, "{isMuted ? t('profile.unmute') : t('profile.mute')}");
    
    // Tabs
    profileCode = profileCode.replace(/>\s*Postagens\s*</, ">\n            {t('profile.tabs.posts')}\n          <");
    profileCode = profileCode.replace(/>\s*Comentários\s*</, ">\n            {t('profile.tabs.comments')}\n          <");
    profileCode = profileCode.replace(/>\s*Respostas\s*</, ">\n            {t('profile.tabs.replies')}\n          <");
    
    // Wallet UI
    profileCode = profileCode.replace(/>Saldo Líquido</, ">{t('profile.wallet.liquidBalance')}<");
    profileCode = profileCode.replace(/>Enviar</, ">{t('profile.wallet.send')}<");
    profileCode = profileCode.replace(/>Power Up</, ">{t('profile.wallet.powerUp')}<");
    profileCode = profileCode.replace(/>Staking</, ">{t('profile.wallet.staking')}<");
    profileCode = profileCode.replace(/>Power Down</, ">{t('profile.wallet.powerDown')}<");
    profileCode = profileCode.replace(/>Delegar</, ">{t('profile.wallet.delegate')}<");
    profileCode = profileCode.replace(/>Pending Curation</, ">{t('profile.wallet.pendingCuration')}<");
    profileCode = profileCode.replace(/>Delegações Feitas</, ">{t('profile.wallet.delegationsOut')}<");
    profileCode = profileCode.replace(/>Remover Delegação</, ">{t('profile.wallet.removeDelegation')}<");
    profileCode = profileCode.replace(/>Delegações Recebidas</, ">{t('profile.wallet.delegationsIn')}<");
    
    // Wallet action titles
    profileCode = profileCode.replace(/'Enviar Tokens'/, "t('profile.wallet.sendTokens')");
    profileCode = profileCode.replace(/'Power Up \(Staking\)'/, "t('profile.wallet.stakeTitle')");
    profileCode = profileCode.replace(/'Power Down \(Unstaking\)'/, "t('profile.wallet.unstakeTitle')");
    profileCode = profileCode.replace(/'Delegar Tokens'/, "t('profile.wallet.delegateTokens')");
    profileCode = profileCode.replace(/'Remover Delegação'/, "t('profile.wallet.removeDelegationTitle')");
    
    // Wallet form
    profileCode = profileCode.replace(/'De \(Usuário que recebeu a delegação\)' : 'Para \(Usuário\)'/, "t('profile.wallet.fromUser') : t('profile.wallet.toUser')");
    profileCode = profileCode.replace(/Quantidade \(/, "{t('profile.wallet.quantity')} (");
    profileCode = profileCode.replace(/Confirmar Transação/, "{t('profile.wallet.confirmTx')}");
    
    // Wallet Alerts
    profileCode = profileCode.replace(/"Transação enviada com sucesso! Os saldos serão atualizados em alguns segundos\."/, "t('profile.wallet.txSuccess')");
    profileCode = profileCode.replace(/"Erro na transação: " \+ res\.msg/, "t('profile.wallet.txError') + res.msg");
    
    // History
    profileCode = profileCode.replace(/Histórico da Conta/, "{t('profile.history.title')}");
    profileCode = profileCode.replace(/Nenhum histórico encontrado\./, "{t('profile.history.empty')}");
    profileCode = profileCode.replace(/Carregar Mais/, "{t('profile.history.loadMore')}");
    profileCode = profileCode.replace(/'Recebido' : 'Enviado'/, "t('profile.history.received') : t('profile.history.sent')");
    profileCode = profileCode.replace(/'Curation Reward'/, "t('profile.history.curationReward')");
    profileCode = profileCode.replace(/'Curation Reward \(Staked\)'/, "t('profile.history.curationRewardStaked')");
    profileCode = profileCode.replace(/'Author Reward'/, "t('profile.history.authorReward')");
    profileCode = profileCode.replace(/'Author Reward \(Staked\)'/, "t('profile.history.authorRewardStaked')");
    profileCode = profileCode.replace(/'Beneficiary Reward'/, "t('profile.history.beneficiaryReward')");
    profileCode = profileCode.replace(/'Beneficiary Reward \(Staked\)'/, "t('profile.history.beneficiaryRewardStaked')");
    profileCode = profileCode.replace(/• De: /, "• {t('profile.history.from')} ");
    profileCode = profileCode.replace(/• Para: /, "• {t('profile.history.to')} ");
    profileCode = profileCode.replace(/• Post: /, "• {t('profile.history.post')} ");
    profileCode = profileCode.replace(/• Memo: /, "• {t('profile.history.memo')} ");
    
    // Discussions
    profileCode = profileCode.replace(/Nenhuma publicação encontrada\./, "{t('profile.noPosts')}");
    profileCode = profileCode.replace(/em resposta a/, "{t('profile.inReplyTo')}");

    fs.writeFileSync('components/Profile.tsx', profileCode);
}
