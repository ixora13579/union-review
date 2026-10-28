-- =========================================================
-- 로그인·역할 권한 적용 (기존 요구안·회신 데이터는 그대로 둔다)
-- Supabase > SQL Editor 에 전체 붙여넣고 Run
-- 여러 번 실행해도 같은 결과가 되도록 작성했다.
--
-- 실행하는 순간부터 로그인하지 않은 접근(anon)은 아무것도 읽거나 쓸 수 없다.
-- =========================================================

-- 1. 사용자 프로필(역할·사업장)
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  name            text not null,                     -- 화면 상단에 표시할 이름
  role            text not null check (role in ('교섭담당','사업장담당')),
  workplace_name  text,                              -- 사업장담당의 사업장(회신의 workplace_name 과 글자가 같아야 함)
  created_at      timestamptz not null default now(),
  constraint profiles_workplace_required
    check (role <> '사업장담당' or workplace_name is not null)
);

alter table public.profiles enable row level security;

-- 2. 현재 사용자의 역할·사업장을 읽는 함수
--    security definer: 정책 안에서 profiles 를 읽을 때 profiles 의 RLS 를 다시 타지 않게 한다
create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.my_workplace()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select workplace_name from public.profiles where id = auth.uid()
$$;

revoke execute on function public.my_role() from public, anon;
revoke execute on function public.my_workplace() from public, anon;
grant execute on function public.my_role() to authenticated;
grant execute on function public.my_workplace() to authenticated;

-- 3. 기존 "누구나 읽기·쓰기" 정책 삭제
drop policy if exists "practice_all_demands" on public.demands;
drop policy if exists "practice_all_reviews" on public.workplace_reviews;

-- 4. profiles: 본인 것만 보기(교섭담당은 전체). 추가·수정·삭제는 Supabase 에서 직접 관리
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.my_role()) = '교섭담당');

-- 5. demands: 프로필이 있는 사용자는 보기, 교섭담당만 추가·수정·삭제
drop policy if exists "demands_select" on public.demands;
drop policy if exists "demands_insert" on public.demands;
drop policy if exists "demands_update" on public.demands;
drop policy if exists "demands_delete" on public.demands;

create policy "demands_select" on public.demands
  for select to authenticated
  using ((select public.my_role()) is not null);

create policy "demands_insert" on public.demands
  for insert to authenticated
  with check ((select public.my_role()) = '교섭담당');

create policy "demands_update" on public.demands
  for update to authenticated
  using ((select public.my_role()) = '교섭담당')
  with check ((select public.my_role()) = '교섭담당');

create policy "demands_delete" on public.demands
  for delete to authenticated
  using ((select public.my_role()) = '교섭담당');

-- 6. workplace_reviews: 교섭담당은 전부, 사업장담당은 자기 사업장 회신만 보기·추가·수정·삭제
--    (요구안을 삭제하면 회신은 on delete cascade 로 함께 지워진다)
drop policy if exists "reviews_select" on public.workplace_reviews;
drop policy if exists "reviews_insert" on public.workplace_reviews;
drop policy if exists "reviews_update" on public.workplace_reviews;
drop policy if exists "reviews_delete" on public.workplace_reviews;

create policy "reviews_select" on public.workplace_reviews
  for select to authenticated
  using (
    (select public.my_role()) = '교섭담당'
    or ((select public.my_role()) = '사업장담당' and workplace_name = (select public.my_workplace()))
  );

create policy "reviews_insert" on public.workplace_reviews
  for insert to authenticated
  with check (
    (select public.my_role()) = '교섭담당'
    or ((select public.my_role()) = '사업장담당' and workplace_name = (select public.my_workplace()))
  );

create policy "reviews_update" on public.workplace_reviews
  for update to authenticated
  using (
    (select public.my_role()) = '교섭담당'
    or ((select public.my_role()) = '사업장담당' and workplace_name = (select public.my_workplace()))
  )
  with check (
    (select public.my_role()) = '교섭담당'
    or ((select public.my_role()) = '사업장담당' and workplace_name = (select public.my_workplace()))
  );

create policy "reviews_delete" on public.workplace_reviews
  for delete to authenticated
  using (
    (select public.my_role()) = '교섭담당'
    or ((select public.my_role()) = '사업장담당' and workplace_name = (select public.my_workplace()))
  );
