import fs from 'fs';

// Read JSON files
let enObj = JSON.parse(fs.readFileSync('locales/en.json', 'utf-8'));
let ptObj = JSON.parse(fs.readFileSync('locales/pt.json', 'utf-8'));

// Function to update JSON
function addTranslation(key, enVal, ptVal) {
    const keys = key.split('.');
    
    function setDeep(obj, ks, val) {
        if(ks.length === 1) {
            obj[ks[0]] = val;
            return;
        }
        if(!obj[ks[0]]) obj[ks[0]] = {};
        setDeep(obj[ks[0]], ks.slice(1), val);
    }
    
    setDeep(enObj, keys, enVal);
    setDeep(ptObj, keys, ptVal);
}

// 1. Discovery
addTranslation('discovery.title', 'Discover Topics', 'Descubra Assuntos');
addTranslation('discovery.subtitle', 'Explore top categories, find new frameworks, and dive deep into the tech universe.', 'Explore as principais categorias, encontre novos frameworks e aprofunde-se no universo da tecnologia.');

let discoveryCode = fs.readFileSync('components/Discovery.tsx', 'utf-8');
discoveryCode = discoveryCode.replace(/import \{ Compass/, "import { useLanguage } from '../contexts/LanguageContext';\nimport { Compass");
discoveryCode = discoveryCode.replace(/const Discovery: React.FC = \(\) => \{/, "const Discovery: React.FC = () => {\n  const { t } = useLanguage();");
discoveryCode = discoveryCode.replace(/>Descubra Assuntos</, ">{t('discovery.title')}<");
discoveryCode = discoveryCode.replace(/>\s*Explore as principais categorias, encontre novos frameworks e aprofunde-se no universo da tecnologia\.\s*</, ">\n            {t('discovery.subtitle')}\n          <");
fs.writeFileSync('components/Discovery.tsx', discoveryCode);

// 2. Feed
addTranslation('feed.title', 'Main Feed', 'Feed Principal');
addTranslation('feed.subtitle', 'Posts from people you follow.', 'Publicações das pessoas que você segue.');
addTranslation('feed.loginToVote', 'Login with Hive Keychain to vote.', 'Faça login com Hive Keychain para votar.');
addTranslation('feed.errorVote', 'Error voting: ', 'Erro ao votar: ');
addTranslation('feed.error', 'Error: ', 'Erro: ');
addTranslation('feed.emptyTitle', 'Your feed is empty', 'Seu feed está vazio');
addTranslation('feed.emptyDesc', 'Explore the community and follow new authors to see posts here.', 'Explore a comunidade e siga novos autores para ver publicações aqui.');
addTranslation('feed.goToExplorer', 'Go to Explorer', 'Ir para Explorer');
addTranslation('feed.readMore', 'Read more', 'Ler mais');

let feedCode = fs.readFileSync('components/Feed.tsx', 'utf-8');
feedCode = feedCode.replace(/import \{ useCommunity \} from '\.\.\/contexts\/CommunityContext';/, "import { useCommunity } from '../contexts/CommunityContext';\nimport { useLanguage } from '../contexts/LanguageContext';");
feedCode = feedCode.replace(/const \{ user, vote \} = useAuth\(\);/, "const { user, vote } = useAuth();\n  const { t } = useLanguage();");
feedCode = feedCode.replace(/"Faça login com Hive Keychain para votar\."/, "t('feed.loginToVote')");
feedCode = feedCode.replace(/"Erro ao votar: " \+ result\.msg/, "t('feed.errorVote') + result.msg");
feedCode = feedCode.replace(/"Erro: " \+ e\.message/, "t('feed.error') + e.message");
feedCode = feedCode.replace(/>\s*Feed Principal\s*</, ">\n            {t('feed.title')}\n          <");
feedCode = feedCode.replace(/>\s*Publicações das pessoas que você segue\.\s*</, ">\n             {t('feed.subtitle')}\n          <");
feedCode = feedCode.replace(/>Seu feed está vazio</, ">{t('feed.emptyTitle')}<");
feedCode = feedCode.replace(/>Explore a comunidade e siga novos autores para ver publicações aqui\.</, ">{t('feed.emptyDesc')}<");
feedCode = feedCode.replace(/>\s*Ir para Explorer\s*</, ">\n            {t('feed.goToExplorer')}\n          <");
feedCode = feedCode.replace(/Ler mais /, "{t('feed.readMore')} ");
fs.writeFileSync('components/Feed.tsx', feedCode);

// Write JSON back
fs.writeFileSync('locales/en.json', JSON.stringify(enObj, null, 2));
fs.writeFileSync('locales/pt.json', JSON.stringify(ptObj, null, 2));
