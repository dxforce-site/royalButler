public with sharing class RoyalButlerController {

    // 【重要】Agent Builderで設定したエージェントのAPI参照名
    private static final String AGENT_API_NAME = 'Sebastian'; 

    /**
     * AgentforceをInvocable Action経由で直接呼び出すメソッド
     * @param userMessage ユーザーの入力メッセージ
     * @param sessionId 会話のセッションID（文脈維持用）
     * @return Agentからの回答テキスト
     */
    @AuraEnabled
    public static Map<String, Object> askSebastian(String userMessage, String sessionId) {
        try {
            // 1. Invocable Actionの作成
            Invocable.Action action = Invocable.Action.createCustomAction('generateAiAgentResponse', AGENT_API_NAME);

            // 2. パラメータの設定
            // 標準アクションの仕様に基づき、'userMessage' を渡します
            action.setInvocationParameter('userMessage', userMessage);
            
            // セッションIDを渡すことで、Agentは「さっきの話」を記憶できます
            if (String.isNotBlank(sessionId)) {
                action.setInvocationParameter('sessionId', sessionId);
            }

            // 3. 実行
            List<Invocable.Action.Result> results = action.invoke();

            // 4. 結果の取得と解析
            if (results.size() > 0 && results[0].isSuccess()) {
                Map<String, Object> output = results[0].getOutputParameters();
                // 全ての出力を返す (response, sessionId 等)
                return output; 
            } else {
                // エラーログを出力
                String errorDetails = 'Agent Error: ' + results[0].getErrors();
                System.debug(errorDetails);
                throw new CalloutException(errorDetails);
            }

        } catch (Exception e) {
            String debugMsg = 'Exception: ' + e.getMessage() + ' Stack: ' + e.getStackTraceString();
            System.debug(debugMsg);
            
            // ユーザー向けの一般的なエラーメッセージ
            String userMsg = '申し訳ございません。執事セバスチャンとの通信中にエラーが発生いたしました。';
            AuraHandledException ahe = new AuraHandledException(userMsg);
            ahe.setMessage(userMsg);
            throw ahe;
        }
    }
}