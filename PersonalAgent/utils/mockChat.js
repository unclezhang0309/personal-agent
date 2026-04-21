function normalizeText(input) {
	return (input || '').toLowerCase().trim();
}

function pickKnowledgeReply(userText, knowledgeItems) {
	const query = normalizeText(userText);
	if (!query) return '';

	for (let i = 0; i < knowledgeItems.length; i += 1) {
		const item = knowledgeItems[i];
		const title = normalizeText(item.title);
		const content = normalizeText(item.content);
		if (title.includes(query) || content.includes(query) || query.includes(title)) {
			return `我在知识库里找到了相关内容：\n【${item.title || '未命名条目'}】\n${item.content}`;
		}
	}

	return '';
}

export function buildMockReply({ userText, roleName, roleDescription, knowledgeItems }) {
	const roleDesc = (roleDescription || '').trim();
	const descPrefix = roleDesc ? `【角色设定】${roleDesc}\n` : '';
	const hitReply = pickKnowledgeReply(userText, knowledgeItems || []);
	if (hitReply) return `${descPrefix}${hitReply}`;

	if (!knowledgeItems || knowledgeItems.length === 0) {
		return `${descPrefix}${roleName || '智能体'} 已收到你的消息。当前未绑定知识库，我先进行通用回复：\n你说的是「${userText}」。`;
	}

	return `${descPrefix}${roleName || '智能体'} 已收到你的消息。暂未命中知识条目，但我会基于已有上下文继续学习。\n你的问题是：${userText}`;
}
