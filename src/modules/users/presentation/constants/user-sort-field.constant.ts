const USER_SORT_FIELDS = ['createdAt', 'name', 'role', 'status'] as const;

type UserSortField = (typeof USER_SORT_FIELDS)[number];

export { USER_SORT_FIELDS, type UserSortField };
