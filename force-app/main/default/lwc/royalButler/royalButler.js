import { LightningElement, track } from 'lwc';
import askSebastian from '@salesforce/apex/RoyalButlerController.askSebastian';
// 静的リソースにアップロードした画像 (SebastianAvatar)
import BUTLER_ICON from '@salesforce/resourceUrl/SebastianAvatar'; 

export default class RoyalButler extends LightningElement {
    butlerIconUrl = BUTLER_ICON;
    
    // チャットメッセージのリスト
    @track messages = [
        { 
            id: 'welcome', 
            text: 'いらっしゃいませ。\nThe Royal Brew へようこそ。\n紅茶の選定からご注文まで、執事セバスチャンが承ります。', 
            type: 'incoming', 
            cssClass: 'message-row incoming' 
        }
    ];
    
    isOpen = false;
    isThinking = false;
    userMessage = '';
    sessionId;

    connectedCallback() {
        // セッションIDはサーバー側で生成および管理されるため、初期化時はnull
        this.sessionId = null;
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            setTimeout(() => this.scrollToBottom(), 100);
        }
    }

    handleInput(event) {
        this.userMessage = event.target.value;
        this.adjustHeight(event.target);
    }

    adjustHeight(element) {
        element.style.height = 'auto'; // Reset height to recalculate
        // Set new height (min 48px)
        if (element.scrollHeight > 48) {
             element.style.height = (element.scrollHeight) + 'px';
        } else {
             element.style.height = '48px';
        }
    }

    handleKeyDown(event) {
        // ... (existing code, keeping it here for context if needed, but replace tool only changes the block)
        if (event.isComposing || event.keyCode === 229) {
            return;
        }
        if (event.key === 'Enter') {
            if (!event.shiftKey) {
                event.preventDefault(); // Prevent newline in textarea when sending
                this.sendMessage();
            }
            // If shiftKey is true, allow default behavior (newline) but also adjust height?
            // handleInput handles value change, but keydown happens before input? 
            // Actually input event fires after change, so it catches the newline.
        }
    }

    async sendMessage() {
        const text = this.userMessage.trim();
        if (!text) return;

        // ユーザーのメッセージを表示
        this.addMessage(text, 'outgoing');
        
        // 入力クリア & 思考中アニメーション開始
        this.refs.inputField.value = '';
        this.refs.inputField.style.height = '48px'; // 高さのリセット
        this.userMessage = '';
        this.isThinking = true;
        this.scrollToBottom();

        try {
            // Apex経由でAgentforceを呼び出し
            const result = await askSebastian({ 
                userMessage: text, 
                sessionId: this.sessionId // 初回はnull/undefined
            });
            console.log('Sebastian Result:', JSON.stringify(result));
            
            // 結果から回答とセッションIDを取得
            let answerText = '';
            if (result.agentResponse) {
                try {
                    const responseObj = JSON.parse(result.agentResponse);
                    answerText = responseObj.value;
                } catch (e) {
                    console.error('Failed to parse agentResponse:', e);
                    answerText = result.agentResponse || 'Auto-response formatting error.';
                }
            }
            const answer = answerText;
            
            // 次回の会話のためにセッションIDを保持
            if (result.sessionId) {
                this.sessionId = result.sessionId;
            }
            
            // 執事の回答を表示
            this.addMessage(answer, 'incoming');

        } catch (error) {
            const errorMsg = error.body ? error.body.message : '申し訳ございません。通信が途絶えてしまったようでございます。';
            this.addMessage(errorMsg, 'incoming');
            console.error('Sebastian Error:', error);
        } finally {
            this.isThinking = false;
            this.scrollToBottom();
        }
    }

    addMessage(text, type) {
        this.messages = [...this.messages, {
            id: Date.now(),
            text: text,
            type: type,
            cssClass: `message-row ${type}`
        }];
    }

    scrollToBottom() {
        setTimeout(() => {
            const chatArea = this.refs.messageList;
            if (chatArea) {
                chatArea.scrollTop = chatArea.scrollHeight;
            }
        }, 0);
    }
}