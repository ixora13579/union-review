-- =========================================================
-- 사업장 회신 보기 권한 변경 (001_auth_roles.sql 다음에 실행)
-- Supabase > SQL Editor 에 전체 붙여넣고 Run
-- 여러 번 실행해도 같은 결과가 되도록 작성했다.
--
-- 보기: 프로필이 있는 사용자는 모든 사업장의 회신을 볼 수 있다
-- 추가·수정·삭제: 변경 없음(교섭담당은 전부, 사업장담당은 자기 사업장 회신만)
-- =========================================================

drop policy if exists "reviews_select" on public.workplace_reviews;

create policy "reviews_select" on public.workplace_reviews
  for select to authenticated
  using ((select public.my_role()) is not null);
