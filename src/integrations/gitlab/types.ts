export interface EscalationPolicy {
    id: number;
    name: string;
}

export interface Label {
    id: number;
    title: string;
    color: string;
    projectId: number;
    createdAt: string;
    updatedAt: string;
    template: boolean;
    description: string;
    type: string;
    groupId: number;
}

export interface Assignee {
    id: number;
    name: string;
    username: string;
    avatarUrl: string;
    email: string;
}

export interface Changes {
    updatedById: {
        previous?: number;
        current: number;
    };
    updatedAt: {
        previous: string;
        current: string;
    };
    labels: {
        previous: Label[];
        current: Label[];
    };
    assignees: {
        previous: Assignee[];
        current: Assignee[];
    };
}

export enum ObjectAttributesAction {
    Open = "open",
    Close = "close",
    Update = "update",
}

export enum ObjectAttributesState {
    Opened = "opened",
    Closed = "closed",
}

export interface ObjectAttributes {
    id: number;
    title: string;
    assigneeIds: number[];
    assigneeId: number;
    authorId: number;
    projectId: number;
    createdAt: string;
    updatedAt: string;
    updatedById: number;
    lastEditedAt?: string;
    lastEditedById?: number;
    relativePosition: number;
    description: string;
    milestoneId?: number;
    stateId: number;
    confidential: boolean;
    discussionLocked: boolean;
    dueDate?: string;
    movedToId?: number;
    duplicatedToId?: number;
    timeEstimate: number;
    totalTimeSpent: number;
    timeChange: number;
    humanTotalTimeSpent?: string;
    humanTimeEstimate?: string;
    humanTimeChange?: string;
    weight?: number;
    healthStatus: string;
    type: string;
    iid: number;
    url: string;
    state: string;
    action: ObjectAttributesAction;
    severity: string;
    escalationStatus: string;
    escalationPolicy: EscalationPolicy;
    labels: Label[];
}

export interface Repository {
    name: string;
    url: string;
    description: string;
    homepage: string;
}

export interface User {
    id: number;
    name: string;
    username: string;
    avatarUrl: string;
    email: string;
}

export interface GitlabEvent {
    objectKind: string;
    eventType: string;
    user: User;
    project: {
        id: number;
        name: string;
        description: string;
        webUrl: string;
        avatarUrl?: string;
        gitSshUrl: string;
        gitHttpUrl: string;
        namespace: string;
        visibilityLevel: number;
        pathWithNamespace: string;
        defaultBranch: string;
        ciConfigPath?: string;
        homepage: string;
        url: string;
        sshUrl: string;
        httpUrl: string;
    };
    objectAttributes: ObjectAttributes;
    repository: Repository;
    assignees: Assignee[];
    assignee: Assignee;
    labels: Label[];
    changes: Changes;
}
