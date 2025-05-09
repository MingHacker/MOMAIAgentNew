create table if not exists qa_history (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    question text not null,
    answer text not null,
    has_image boolean default false,
    image_url text,  -- 存储图片的 URL
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 创建索引
create index if not exists qa_history_user_id_idx on qa_history(user_id);
create index if not exists qa_history_created_at_idx on qa_history(created_at);

-- 添加 RLS 策略
alter table qa_history enable row level security;

create policy "Users can view their own qa history"
    on qa_history for select
    using (auth.uid() = user_id);

create policy "Users can insert their own qa history"
    on qa_history for insert
    with check (auth.uid() = user_id);

-- 创建 Storage bucket 用于存储图片
insert into storage.buckets (id, name, public) 
values ('qa_images', 'qa_images', true)
on conflict (id) do nothing;

-- 设置 Storage 权限
create policy "Users can upload their own images"
    on storage.objects for insert
    with check (
        bucket_id = 'qa_images' 
        and auth.uid() = (storage.foldername(name))[1]::uuid
    );

create policy "Users can view their own images"
    on storage.objects for select
    using (
        bucket_id = 'qa_images' 
        and auth.uid() = (storage.foldername(name))[1]::uuid
    ); 