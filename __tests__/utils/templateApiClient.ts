/**
 * n8n Template API Client
 *
 * Utility functions to interact with n8n's public template API for testing purposes.
 */

/** テンプレート検索 API エンドポイント */
export const templatesSearchApiUrl = 'https://api.n8n.io/api/templates/search';

/** ワークフロー詳細 API エンドポイント */
export const templatesWorkflowsApiUrl = 'https://api.n8n.io/api/templates/workflows';

/**
 * Search API レスポンスの型定義
 */
interface SearchResponse {
    totalWorkflows: number;
    workflows: Array<{
        id: number;
        name: string;
    }>;
}

/**
 * Workflow Details API レスポンスの型定義
 */
interface WorkflowDetailsResponse {
    workflow: {
        id: number;
        name: string;
        workflow: {
            nodes: unknown[];
            connections: Record<string, unknown>;
        };
    };
}

/**
 * フェッチしたワークフローの型定義
 */
export interface FetchedWorkflow {
    id: number;
    name: string;
    workflow: {
        nodes: unknown[];
        connections: Record<string, unknown>;
    };
}

/**
 * 検索APIからワークフローIDリストを取得
 *
 * @param limit - 取得件数（デフォルト: 100）
 * @param offset - オフセット（デフォルト: 0）
 * @returns ワークフロー情報の配列
 */
export async function fetchWorkflowList(
    limit = 100,
    offset = 0
): Promise<Array<{ id: number; name: string }>> {
    const url = `${templatesSearchApiUrl}?limit=${limit}`;

    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch workflow list: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as SearchResponse;
    return data.workflows;
}

/**
 * ランダムにワークフローIDを選択
 *
 * @param count - 選択するワークフロー数
 * @returns ランダムに選択されたワークフロー情報の配列
 */
export async function fetchRandomWorkflowIds(
    count: number
): Promise<Array<{ id: number; name: string }>> {
    // まず総数を取得
    const initial = await fetchWorkflowList(1, 0);
    if (initial.length === 0) {
        return [];
    }

    // より多くのワークフローを取得（最大500件から選択）
    const maxFetch = 500;
    const workflows = await fetchWorkflowList(maxFetch, 0);

    if (workflows.length === 0) {
        return [];
    }

    // Fisher-Yates シャッフルでランダムに選択
    const shuffled = [...workflows];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * ワークフローIDから詳細情報を取得
 *
 * @param id - ワークフローID
 * @returns ワークフロー詳細情報
 */
export async function fetchWorkflowDetails(id: number): Promise<FetchedWorkflow> {
    const url = `${templatesWorkflowsApiUrl}/${id}`;

    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch workflow ${id}: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as WorkflowDetailsResponse;

    return {
        id: data.workflow.id,
        name: data.workflow.name,
        workflow: data.workflow.workflow,
    };
}

/**
 * ランダムにN件のワークフローを取得（メイン関数）
 *
 * @param count - 取得するワークフロー数（デフォルト: 5）
 * @returns ワークフロー詳細情報の配列
 */
export async function fetchRandomWorkflows(count = 5): Promise<FetchedWorkflow[]> {
    const randomIds = await fetchRandomWorkflowIds(count);

    const workflows: FetchedWorkflow[] = [];

    for (const { id } of randomIds) {
        try {
            const workflow = await fetchWorkflowDetails(id);
            workflows.push(workflow);
        } catch (error) {
            // 個別のワークフロー取得失敗はスキップ
            console.warn(`Failed to fetch workflow ${id}:`, error);
        }
    }

    return workflows;
}
