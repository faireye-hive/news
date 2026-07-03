export interface CommunityConfig {
  tokenSymbol: string;
  useLegacyScot: boolean;
}

// Arquivo de configuração simples para mudar a comunidade.
// Altere 'tokenSymbol' para o símbolo da moeda (ex: 'POB', 'BYTE').
// Altere 'useLegacyScot' para true se a comunidade usar a API antiga (scot-api).
export const communityConfig: CommunityConfig = {
  tokenSymbol: 'NEWS',
  useLegacyScot: false,
};

// Lista de usuários que você não quer que apareçam no explorer (feed)
// Adicione os nomes dos usuários que deseja ocultar aqui. Ex: ['user1', 'user2']
export const bannedUsers: string[] = ['web2.support', 'usuario2'];
