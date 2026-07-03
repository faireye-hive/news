import fs from 'fs';

// --- Chat.tsx ---
let chatCode = fs.readFileSync('components/Chat.tsx', 'utf-8');
if(!chatCode.includes('useLanguage')) {
    chatCode = chatCode.replace(/import \{ useCommunity \} from '\.\.\/contexts\/CommunityContext';/, "import { useCommunity } from '../contexts/CommunityContext';\nimport { useLanguage } from '../contexts/LanguageContext';");
    chatCode = chatCode.replace(/const \{ user, customJson \} = useAuth\(\);/, "const { user, customJson } = useAuth();\n  const { t } = useLanguage();");
    chatCode = chatCode.replace(/\{community\} Public Chat/, "{community}{t('chat.title')}");
    chatCode = chatCode.replace(/Todas as mensagens são públicas e registradas na blockchain Hive\./, "{t('chat.subtitle')}");
    chatCode = chatCode.replace(/> Chat</, ">{t('chat.chatMode')}<");
    chatCode = chatCode.replace(/> Feed</, ">{t('chat.feedMode')}<");
    chatCode = chatCode.replace(/Nenhuma mensagem ainda\./, "{t('chat.noMessages')}");
    chatCode = chatCode.replace(/Seja o primeiro a enviar algo!/, "{t('chat.beFirst')}");
    chatCode = chatCode.replace(/isMe \? 'Você' : msg\.author/, "isMe ? t('chat.you') : msg.author");
    chatCode = chatCode.replace(/Carregar Mais Antigas/, "{t('chat.loadMore')}");
    chatCode = chatCode.replace(/Digite sua mensagem\.\.\./, '` + "${t(\'chat.placeholder\')}" + `');
    chatCode = chatCode.replace(/"Digite sua mensagem\.\.\."/, "{t('chat.placeholder')}");
    chatCode = chatCode.replace(/>Enviar</, ">{t('chat.send')}<");
    chatCode = chatCode.replace(/Conecte-se para enviar mensagens no chat/, "{t('chat.loginToChat')}");
    chatCode = chatCode.replace(/"Erro ao enviar mensagem: " \+ res\.msg/, "t('chat.errorSend') + res.msg");
    fs.writeFileSync('components/Chat.tsx', chatCode);
}

// --- CreatePost.tsx ---
let createPostCode = fs.readFileSync('components/CreatePost.tsx', 'utf-8');
if(!createPostCode.includes('useLanguage')) {
    createPostCode = createPostCode.replace(/import \{ useNavigate \} from 'react-router-dom';/, "import { useNavigate } from 'react-router-dom';\nimport { useLanguage } from '../contexts/LanguageContext';");
    createPostCode = createPostCode.replace(/const \{ user, comment \} = useAuth\(\);/, "const { user, comment } = useAuth();\n  const { t } = useLanguage();");
    createPostCode = createPostCode.replace(/>Login Necessário</, ">{t('createPost.loginRequired')}<");
    createPostCode = createPostCode.replace(/Faça login com Hive Keychain para poder criar publicações na comunidade\./, "{t('createPost.loginDesc')}");
    createPostCode = createPostCode.replace(/"Título e conteúdo são obrigatórios\."/, "t('createPost.titleReq')");
    createPostCode = createPostCode.replace(/"Publicação enviada com sucesso!"/, "t('createPost.success')");
    createPostCode = createPostCode.replace(/"Erro ao publicar: " \+ result\.msg/, "t('createPost.error') + result.msg");
    createPostCode = createPostCode.replace(/"Erro ao publicar: " \+ e\.message/, "t('createPost.error') + e.message");
    createPostCode = createPostCode.replace(/Criar Publicação/, "{t('createPost.title')}");
    createPostCode = createPostCode.replace(/>\s*Editar\s*</, ">\n               {t('createPost.editBtn')}\n             <");
    createPostCode = createPostCode.replace(/>\s*Visualizar\s*</, ">\n               {t('createPost.previewBtn')}\n             <");
    createPostCode = createPostCode.replace(/>Título</, ">{t('createPost.titleLabel')}<");
    createPostCode = createPostCode.replace(/"Um título chamativo para seu post\.\.\."/, "{t('createPost.titlePlaceholder')}");
    createPostCode = createPostCode.replace(/Sua História \(em Markdown\)/, "{t('createPost.bodyLabel')}");
    createPostCode = createPostCode.replace(/Imagens podem ser adicionadas com \!\[Nome\]\(URL\)/, "{t('createPost.bodyHint')}");
    createPostCode = createPostCode.replace(/"Escreva sua publicação usando Markdown\.\.\."/, "{t('createPost.bodyPlaceholder')}");
    createPostCode = createPostCode.replace(/> Tags</, "> {t('createPost.tagsLabel')}<");
    createPostCode = createPostCode.replace(/"Personalize suas tags \(separadas por vírgula\)\.\.\."/, "{t('createPost.tagsPlaceholder')}");
    createPostCode = createPostCode.replace(/A primeira tag define a categoria principal do seu post\. Limite de 10 tags\./, "{t('createPost.tagsHint')}");
    createPostCode = createPostCode.replace(/Opções Avançadas/, "{t('createPost.advOptions')}");
    createPostCode = createPostCode.replace(/Declinar Pagamento \(Decline Payout\)/, "{t('createPost.declinePayout')}");
    createPostCode = createPostCode.replace(/O post não receberá recompensas HBD\/HP, mas pode continuar recebendo tokens da Hive Engine\./, "{t('createPost.declineDesc')}");
    createPostCode = createPostCode.replace(/Nada para visualizar\./, "{t('createPost.nothingPreview')}");
    createPostCode = createPostCode.replace(/Publicar Post/, "{t('createPost.publishBtn')}");
    fs.writeFileSync('components/CreatePost.tsx', createPostCode);
}

// --- Dashboard.tsx ---
let dashboardCode = fs.readFileSync('components/Dashboard.tsx', 'utf-8');
if(!dashboardCode.includes('useLanguage')) {
    dashboardCode = dashboardCode.replace(/import \{ useCommunity \} from '\.\.\/contexts\/CommunityContext';/, "import { useCommunity } from '../contexts/CommunityContext';\nimport { useLanguage } from '../contexts/LanguageContext';");
    dashboardCode = dashboardCode.replace(/const \{ community \} = useCommunity\(\);/, "const { community } = useCommunity();\n  const { t } = useLanguage();");
    dashboardCode = dashboardCode.replace(/>Erro ao carregar dados do token \{community\}\.</, ">{t('dashboard.errorData')} {community}.<");
    dashboardCode = dashboardCode.replace(/"Token de curadoria e engajamento da comunidade\."/, "t('dashboard.tokenDesc')");
    dashboardCode = dashboardCode.replace(/"Volume \(24h\)"/, "t('dashboard.volume')");
    dashboardCode = dashboardCode.replace(/"Supply Circulante"/, "t('dashboard.circSupply')");
    dashboardCode = dashboardCode.replace(/"Maior Bid"/, "t('dashboard.highestBid')");
    dashboardCode = dashboardCode.replace(/"Menor Ask"/, "t('dashboard.lowestAsk')");
    dashboardCode = dashboardCode.replace(/Análise de Mercado IA/, "{t('dashboard.aiTitle')}");
    dashboardCode = dashboardCode.replace(/Análise por IA não configurada/, "{t('dashboard.aiNotConfigured')}");
    dashboardCode = dashboardCode.replace(/Para habilitar esta feature, adicione a variável/, "{t('dashboard.aiConfigDesc')}");
    dashboardCode = dashboardCode.replace(/no ambiente\./, "{t('dashboard.inEnvironment')}");
    dashboardCode = dashboardCode.replace(/Solicite uma análise instantânea baseada nos dados atuais do mercado usando a IA Gemini\./, "{t('dashboard.aiPrompt')}");
    dashboardCode = dashboardCode.replace(/"Analisando\.\.\."/, "t('dashboard.analyzing')");
    dashboardCode = dashboardCode.replace(/"Gerar Insights com IA"/, "t('dashboard.generateInsights')");
    dashboardCode = dashboardCode.replace(/Profundidade de Mercado \(Top 10\)/, "{t('dashboard.marketDepth')}");
    dashboardCode = dashboardCode.replace(/Bids \(Compra\)/, "{t('dashboard.bids')}");
    dashboardCode = dashboardCode.replace(/Asks \(Venda\)/, "{t('dashboard.asks')}");
    dashboardCode = dashboardCode.replace(/Top Holders/, "{t('dashboard.topHolders')}");
    fs.writeFileSync('components/Dashboard.tsx', dashboardCode);
}
