import { llmsConfig, tryCompletionsConfig } from "../utils/llmsConfig.js";
import { queryChatGPT } from "../api/chatgpt.js";

export class CompletionsService {
  constructor(tokensService) {
    this.tokensService = tokensService;
  }

  async updateCompletionTokens(tokenId, energy, operation) {
    const adminToken = await this.tokensService.getAdminTokenById(tokenId);
    if (!adminToken) return;

    const user_token_id = adminToken.user_id;
    if (!user_token_id) return false;

    await this.tokensService.updateUserToken(user_token_id, energy, operation);

    const user_token = await this.tokensService.getUserToken(adminToken.user_id);
    if (!user_token) return false;

    await this.tokensService.updateAdminTokenByUserId(user_token.id);

    return true;
  }

  async updateCompletionTokensByModel({ model, tokenId, tokens }) {
    const convertationEnergy = llmsConfig[model].convertationEnergy;
    const energy = Math.round(tokens / convertationEnergy);

    await this.updateCompletionTokens(tokenId, energy);

    return energy;
  }

  async tryEndpoints(params, endpoints) {
    for await (const endpoint of endpoints) {
      try {
        console.log(llmsConfig[endpoint]);
        const completionEndpoint = llmsConfig[endpoint].endpoint;
        const model = llmsConfig[endpoint].modelName;

        return await completionEndpoint.chat.completions.create({ ...params, model });
      } catch (e) {
        console.log(e);
      }
    }
  }

  async completions(params) {
    return this.tryEndpoints(params, [params.model, `${params.model}_guo`, "gpt-auto"]);
  }

  async tryQueryCompletions(
    userQuery,
    userToken,
    dialogName,
    model,
    systemMessageContent,
    tokenLimit,
    singleMessage,
    tokenAdmin,
  ) {
    const modelsChain = tryCompletionsConfig[model];

    if (!modelsChain) {
      return await queryChatGPT(
        userQuery,
        userToken,
        dialogName,
        model,
        systemMessageContent,
        tokenLimit,
        singleMessage,
        tokenAdmin,
      );
    }

    for (const modelsChainElement of modelsChain) {
      console.log(modelsChainElement);
      const response = await queryChatGPT(
        userQuery,
        userToken,
        dialogName,
        modelsChainElement,
        systemMessageContent,
        tokenLimit,
        singleMessage,
        tokenAdmin,
      );

      if (response.success) return response;
    }

    return {
      success: false,
      error: `Сеть Deep.GPT сейчас перегружена, попробуйте позже! 
Или напишите нам в чат, постараемся помочь! 😊
https://t.me/+VMrsvzEcp2czOWJi`,
    };
  }
}
