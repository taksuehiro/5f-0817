// 5フォース分析ツールのメインロジック
class FiveForcesAnalyzer {
    constructor() {
        this.currentCategoryIndex = 0;
        this.currentNodeId = 'q1';
        this.answers = {};
        this.analysisData = null;
        this.init();
    }

    async init() {
        try {
            await this.loadAnalysisData();
            this.startAnalysis();
        } catch (error) {
            console.error('初期化エラー:', error);
            this.showError('データの読み込みに失敗しました。');
        }
    }

    async loadAnalysisData() {
        try {
            const response = await fetch('5F_Tree.json');
            this.analysisData = await response.json();
        } catch (error) {
            throw new Error('5F_Tree.jsonファイルの読み込みに失敗しました');
        }
    }

    startAnalysis() {
        this.showQuestion();
        this.updateProgress();
    }

    showQuestion() {
        const container = document.getElementById('questionContainer');
        const category = this.analysisData.five_forces[this.currentCategoryIndex];
        const node = this.findNode(category.nodes, this.currentNodeId);

        if (!node) {
            this.completeCategory();
            return;
        }

        container.innerHTML = `
            <div class="category-title">
                ${category.category} (${this.currentCategoryIndex + 1}/5)
            </div>
            <div class="question">
                ${node.question}
            </div>
            <div class="choices">
                ${node.choices.map((choice, index) => `
                    <button class="choice-btn" onclick="analyzer.selectChoice('${choice.label}', '${choice.next}')">
                        ${choice.label}
                    </button>
                `).join('')}
            </div>
        `;

        // 選択肢がない場合は終端ノード
        if (node.choices.length === 0) {
            this.completeCategory();
        }
    }

    findNode(nodes, nodeId) {
        return nodes.find(node => node.id === nodeId);
    }

    selectChoice(choice, nextNodeId) {
        // 選択肢のボタンをハイライト
        const buttons = document.querySelectorAll('.choice-btn');
        buttons.forEach(btn => btn.classList.remove('selected'));
        event.target.classList.add('selected');

        // 回答を保存
        const categoryKey = this.analysisData.five_forces[this.currentCategoryIndex].category;
        if (!this.answers[categoryKey]) {
            this.answers[categoryKey] = [];
        }
        this.answers[categoryKey].push({
            question: this.findNode(this.analysisData.five_forces[this.currentCategoryIndex].nodes, this.currentNodeId).question,
            answer: choice
        });

        // 次のノードに進む
        if (nextNodeId) {
            this.currentNodeId = nextNodeId;
            setTimeout(() => this.showQuestion(), 500);
        } else {
            this.completeCategory();
        }
    }

    completeCategory() {
        this.currentCategoryIndex++;
        
        if (this.currentCategoryIndex < this.analysisData.five_forces.length) {
            // 次のカテゴリに進む
            this.currentNodeId = 'q1';
            setTimeout(() => this.showQuestion(), 1000);
        } else {
            // 全カテゴリ完了
            this.showResults();
        }
        
        this.updateProgress();
    }

    updateProgress() {
        const progress = (this.currentCategoryIndex / this.analysisData.five_forces.length) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
    }

    showResults() {
        const container = document.getElementById('questionContainer');
        const resultsContainer = document.getElementById('resultsContainer');
        
        container.style.display = 'none';
        resultsContainer.style.display = 'block';
        
        resultsContainer.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>分析結果を生成中...</p>
            </div>
        `;

        setTimeout(() => {
            this.generateResults();
        }, 2000);
    }

    generateResults() {
        const resultsContainer = document.getElementById('resultsContainer');
        let resultsHTML = '<h2 style="text-align: center; margin-bottom: 30px; color: #2c3e50;">📊 5フォース分析結果</h2>';

        this.analysisData.five_forces.forEach(category => {
            const categoryAnswers = this.answers[category.category] || [];
            const analysis = this.analyzeCategory(category.category, categoryAnswers);
            
            resultsHTML += `
                <div class="result-category">
                    <h3>${category.category}</h3>
                    <div class="summary">
                        <h4>【要点まとめ】</h4>
                        <p>${analysis.summary}</p>
                    </div>
                    <div class="details">
                        <h4>【詳細分析】</h4>
                        <p>${analysis.details}</p>
                    </div>
                    ${analysis.aiNote ? `
                        <div class="ai-note">
                            <h4>【AI補足】</h4>
                            <p>${analysis.aiNote}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        });

        // 総合サマリーを追加
        const overallSummary = this.generateOverallSummary();
        resultsHTML += `
            <div class="result-category" style="background: #e8f5e8; border-left-color: #27ae60;">
                <h3>🎯 総合サマリー</h3>
                <div class="summary">
                    <h4>【事業の強み・競合優位性】</h4>
                    <p>${overallSummary}</p>
                </div>
            </div>
        `;

        resultsContainer.innerHTML = resultsHTML;
    }

    analyzeCategory(categoryName, answers) {
        const analysis = {
            summary: '',
            details: '',
            aiNote: ''
        };

        switch (categoryName) {
            case '業界内の競争（自社環境）':
                analysis.summary = this.analyzeCompetition(answers);
                analysis.details = this.getCompetitionDetails(answers);
                break;
            case '買い手の交渉力（顧客）':
                analysis.summary = this.analyzeBuyerPower(answers);
                analysis.details = this.getBuyerPowerDetails(answers);
                break;
            case '売り手の交渉力（仕入れ・外注）':
                analysis.summary = this.analyzeSupplierPower(answers);
                analysis.details = this.getSupplierPowerDetails(answers);
                break;
            case '新規参入の脅威':
                analysis.summary = this.analyzeNewEntrants(answers);
                analysis.details = this.getNewEntrantsDetails(answers);
                break;
            case '代替品の脅威':
                analysis.summary = this.analyzeSubstitutes(answers);
                analysis.details = this.getSubstitutesDetails(answers);
                break;
        }

        return analysis;
    }

    analyzeCompetition(answers) {
        const answersText = answers.map(a => a.answer).join(', ');
        
        if (answersText.includes('地域の中小企業')) {
            return '地域内での中小企業間競争が存在。差別化による競争優位性の構築が重要。';
        } else if (answersText.includes('大手企業')) {
            return '大手企業との競合環境。地域密着や専門性による差別化が鍵。';
        } else {
            return '競合認識が低い状況。市場分析の見直しと差別化戦略の検討が必要。';
        }
    }

    getCompetitionDetails(answers) {
        const answersText = answers.map(a => a.answer).join(', ');
        let details = '';

        if (answersText.includes('明確な強みがある')) {
            details += '自社の明確な強みを確認。';
        } else {
            details += '差別化要素の明確化が必要。';
        }

        if (answersText.includes('はい')) {
            details += '顧客への強みの伝達ができている。';
        } else {
            details += '強みの顧客への伝達強化が必要。';
        }

        return details + ' 競争環境において、継続的な差別化と顧客価値の向上が重要。';
    }

    analyzeBuyerPower(answers) {
        const answersText = answers.map(a => a.answer).join(', ');
        
        if (answersText.includes('元請主導')) {
            return '元請け企業の強い交渉力。価格競争力と品質保証が重要。';
        } else if (answersText.includes('価格重視')) {
            return '顧客の価格感度が高い。コスト効率と価値提案が鍵。';
        } else {
            return '顧客との関係性は良好。長期的な信頼関係の構築が進んでいる。';
        }
    }

    getBuyerPowerDetails(answers) {
        const answersText = answers.map(a => a.answer).join(', ');
        let details = '';

        if (answersText.includes('多い')) {
            details += '価格比較が頻繁に行われる環境。';
        } else {
            details += '価格以外の要素で選ばれている。';
        }

        if (answersText.includes('低い')) {
            details += '顧客の乗り換えコストが低いため、継続的な価値提供が重要。';
        } else {
            details += '高いスイッチングコストにより顧客ロイヤルティが確保されている。';
        }

        return details;
    }

    analyzeSupplierPower(answers) {
        const answersText = answers.map(a => a.answer).join(', ');
        
        if (answersText.includes('ほぼ自社完結')) {
            return '外部依存度が低く、供給リスクは小さい。';
        } else if (answersText.includes('固定')) {
            return '特定の供給者への依存度が高い。供給者分散の検討が必要。';
        } else {
            return '複数の供給者との関係を維持。供給リスクは中程度。';
        }
    }

    getSupplierPowerDetails(answers) {
        const answersText = answers.map(a => a.answer).join(', ');
        let details = '';

        if (answersText.includes('探すのが大変')) {
            details += '協力会社の確保が課題。';
        } else {
            details += '協力会社との関係は良好。';
        }

        details += ' 供給者との関係管理とリスク分散が重要。';

        return details;
    }

    analyzeNewEntrants(answers) {
        const answersText = answers.map(a => a.answer).join(', ');
        
        if (answersText.includes('増えている')) {
            return '新規参入が増加中。参入障壁の強化と差別化が急務。';
        } else if (answersText.includes('減っている')) {
            return '新規参入が減少。業界の魅力低下や参入障壁の高さが影響。';
        } else {
            return '新規参入は安定。現状の競争環境を維持。';
        }
    }

    getNewEntrantsDetails(answers) {
        const answersText = answers.map(a => a.answer).join(', ');
        let details = '';

        if (answersText.includes('デジタルで集客')) {
            details += 'デジタルマーケティングによる新規参入が増加。';
        } else {
            details += '従来型の営業手法による参入が主流。';
        }

        details += ' 参入障壁の維持と自社の競争優位性の強化が重要。';

        return details;
    }

    analyzeSubstitutes(answers) {
        const answersText = answers.map(a => a.answer).join(', ');
        
        if (answersText.includes('代替可能')) {
            return '代替手段が存在。独自の価値提案と差別化が重要。';
        } else if (answersText.includes('代替しにくい')) {
            return '代替手段が限定的。専門性と品質による優位性を維持。';
        } else {
            return '代替品の脅威は中程度。継続的な価値向上が重要。';
        }
    }

    getSubstitutesDetails(answers) {
        const answersText = answers.map(a => a.answer).join(', ');
        let details = '';

        if (answersText.includes('安さ重視')) {
            details += '価格競争が激しい環境。';
        } else if (answersText.includes('品質・安心')) {
            details += '品質と信頼性が重視される環境。';
        }

        details += ' 顧客の根本的ニーズを満たす独自の価値提供が重要。';

        return details;
    }

    generateOverallSummary() {
        const allAnswers = Object.values(this.answers).flat();
        const answersText = allAnswers.map(a => a.answer).join(', ');
        
        let strengths = [];
        let challenges = [];

        if (answersText.includes('明確な強みがある')) {
            strengths.push('明確な競争優位性');
        }
        if (answersText.includes('はい')) {
            strengths.push('顧客への価値伝達力');
        }
        if (answersText.includes('ほぼ自社完結')) {
            strengths.push('供給リスクの低さ');
        }
        if (answersText.includes('高い')) {
            strengths.push('顧客ロイヤルティ');
        }

        if (answersText.includes('特にない')) {
            challenges.push('差別化要素の不足');
        }
        if (answersText.includes('増えている')) {
            challenges.push('新規参入の脅威');
        }
        if (answersText.includes('代替可能')) {
            challenges.push('代替品の脅威');
        }

        let summary = '';
        if (strengths.length > 0) {
            summary += `【強み】${strengths.join('、')}。`;
        }
        if (challenges.length > 0) {
            summary += `【課題】${challenges.join('、')}への対応が必要。`;
        }

        summary += ' 地域密着型の専門性と顧客信頼を基盤とした持続的な競争優位性の構築が推奨されます。';

        return summary;
    }

    showError(message) {
        const container = document.getElementById('questionContainer');
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #e74c3c;">
                <h3>エラーが発生しました</h3>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    再読み込み
                </button>
            </div>
        `;
    }
}

// グローバル変数としてアナライザーを初期化
let analyzer;

// ページ読み込み完了時にアナライザーを開始
document.addEventListener('DOMContentLoaded', () => {
    analyzer = new FiveForcesAnalyzer();
});

// ナビゲーション関数（必要に応じて実装）
function previousQuestion() {
    // 前の質問に戻る機能（必要に応じて実装）
}

function nextQuestion() {
    // 次の質問に進む機能（必要に応じて実装）
}
