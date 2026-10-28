-- =========================================================
-- 노조 요구안 검토 관리 (교육 실습용 · 전부 가상 데이터)
-- Supabase > SQL Editor 에 전체 붙여넣고 Run
-- =========================================================

-- 다시 실행할 때를 대비해 기존 테이블 삭제
-- (profiles 는 계정별 역할 정보라 지우지 않는다. 아래에서 없을 때만 만든다)
drop table if exists workplace_reviews;
drop table if exists demands;

-- 1. 요구안 + 사측 검토(1~5단계)
create table demands (
  id                  bigint generated always as identity primary key,
  demand_no           text not null unique,           -- 요구안번호
  category            text not null,                  -- 분야
  title               text not null,                  -- 제목
  union_request       text,                           -- 노조 요구내용

  -- 1단계: 24년도 요구안
  prev_2024_request   text,
  prev_2024_result    text check (prev_2024_result in ('수용','일부수용','불수용','신규')),

  -- 2단계: 교섭대상 판단
  bargaining_subject  text check (bargaining_subject in ('의무교섭','임의교섭','교섭대상아님')),
  bargaining_opinion  text,

  -- 3단계: 인사경영권 침해
  mgmt_right          text check (mgmt_right in ('없음','일부','침해')),
  mgmt_right_opinion  text,

  -- 4단계: 예산수반
  budget_required     text check (budget_required in ('미수반','수반')),
  budget_amount       bigint,                         -- 연간 추정액(원)
  budget_opinion      text,

  -- 5단계: 법적검토
  legal_review        text check (legal_review in ('적법','위법소지','추가검토')),
  legal_opinion       text,

  -- 종합의견
  status              text not null default '검토중'
                      check (status in ('검토중','수용','일부수용','수용곤란')),
  created_at          timestamptz not null default now()
);

-- 2. 6단계: 현장실효성(사업장 의견조회)
create table workplace_reviews (
  id              bigint generated always as identity primary key,
  demand_id       bigint not null references demands(id) on delete cascade,
  workplace_name  text not null,
  current_status  text,                               -- 현장현황
  feasibility     text check (feasibility in ('가능','조건부','곤란')),  -- 실행가능성
  opinion         text,
  created_at      timestamptz not null default now()
);

-- 권한(RLS): 로그인한 사용자만, 역할별로 접근
alter table demands enable row level security;
alter table workplace_reviews enable row level security;

-- 3. 사용자 프로필(역할·사업장)
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

-- 4. 현재 사용자의 역할·사업장을 읽는 함수
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

-- 5. profiles: 본인 것만 보기(교섭담당은 전체). 추가·수정·삭제는 Supabase 에서 직접 관리
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.my_role()) = '교섭담당');

-- 6. demands: 프로필이 있는 사용자는 보기, 교섭담당만 추가·수정·삭제
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

-- 7. workplace_reviews: 보기는 프로필이 있는 사용자 모두,
--    추가·수정·삭제는 교섭담당은 전부, 사업장담당은 자기 사업장 회신만
--    (요구안을 삭제하면 회신은 on delete cascade 로 함께 지워진다)
drop policy if exists "reviews_select" on public.workplace_reviews;
drop policy if exists "reviews_insert" on public.workplace_reviews;
drop policy if exists "reviews_update" on public.workplace_reviews;
drop policy if exists "reviews_delete" on public.workplace_reviews;

create policy "reviews_select" on public.workplace_reviews
  for select to authenticated
  using ((select public.my_role()) is not null);

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

-- =========================================================
-- 가상 요구안 10건 (검토 진행 정도를 다양하게)
-- =========================================================
insert into demands
(demand_no, category, title, union_request,
 prev_2024_request, prev_2024_result,
 bargaining_subject, bargaining_opinion,
 mgmt_right, mgmt_right_opinion,
 budget_required, budget_amount, budget_opinion,
 legal_review, legal_opinion, status)
values
('2026-01','휴가','연차휴가 일수 확대',
 '근속 3년 이상 직원에게 연차휴가 2일 추가 부여',
 '근속 3년 이상 연차 1일 가산', '불수용',
 '의무교섭','휴가는 근로조건으로 의무적 교섭사항',
 '없음','인사경영권과 무관',
 '수반',120000000,'대체인력 및 연차수당 증가분 추정',
 '적법','근로기준법 기준 이상 부여로 문제 없음',
 '일부수용'),

('2026-02','복지','자녀 학자금 지원 범위 확대',
 '자녀 학자금 지원 대상을 대학원까지 확대',
 '고등학교 학자금 지원 한도 인상', '일부수용',
 '의무교섭','복리후생 사항으로 교섭대상',
 '없음','해당 없음',
 '수반',80000000,'대상 인원 기준 연간 추정',
 '적법','복리후생비 운영기준 범위 내 검토 필요',
 '일부수용'),

('2026-03','근로시간','유연근무 신청 요건 완화',
 '유연근무 신청 시 부서장 사전승인 절차 간소화',
 null, '신규',
 '의무교섭','근로시간 운영에 관한 사항',
 '일부','부서 업무공백 관리 권한 일부 관련',
 '미수반',null,'추가 예산 없음',
 '적법','법적 쟁점 없음',
 '수용'),

('2026-04','인사','승진심사위원회 노조 추천위원 참여',
 '승진심사위원회에 노조 추천위원 1명 참여',
 '승진심사위원회 노조 참관', '불수용',
 '임의교섭','인사권 행사 절차로 의무교섭 대상 아님',
 '침해','승진 결정은 고유 인사권 영역',
 '미수반',null,'추가 예산 없음',
 '적법','법 위반은 아니나 인사규정 개정 필요',
 '수용곤란'),

('2026-05','노조활동','노조 전임자 1명 증원',
 '근로시간 면제자 1명 추가 지정',
 '근로시간 면제자 1명 증원', '불수용',
 '의무교섭','근로시간면제 운영은 교섭 가능 사항',
 '없음','해당 없음',
 '수반',60000000,'면제자 인건비 및 대체인력 비용',
 '위법소지','법정 근로시간면제 한도 초과 여부 확인 필요',
 '검토중'),

('2026-06','임금','직급보조비 인상',
 '전 직급 직급보조비 월 5만원 인상',
 '직급보조비 월 3만원 인상', '불수용',
 '의무교섭','임금 관련 사항으로 교섭대상',
 null,null,
 null,null,null,
 null,null,
 '검토중'),

('2026-07','휴가','병가 유급기간 확대',
 '유급 병가 기간을 연 60일에서 90일로 확대',
 null, '신규',
 '의무교섭','휴가·휴직 관련 근로조건',
 '없음','해당 없음',
 null,null,null,
 null,null,
 '검토중'),

('2026-08','복지','건강검진 지원 대상 확대',
 '건강검진 지원 대상에 배우자 포함',
 null, '신규',
 '의무교섭','복리후생 사항',
 '없음','해당 없음',
 '수반',45000000,'배우자 수 기준 연간 추정',
 null,null,
 '검토중'),

('2026-09','인사','정기 인사이동 시 본인 희망 반영',
 '정기 인사이동 시 본인 희망지를 우선 반영',
 '인사이동 사전 고지 기간 확대', '수용',
 '임의교섭','인사 원칙에 관한 사항으로 협의 가능',
 '일부','최종 배치 결정권은 유지 전제',
 '미수반',null,'추가 예산 없음',
 '적법','인사규정 내 반영 가능',
 '수용'),

('2026-10','근로시간','야간 비상근무 후 익일 휴식 보장',
 '야간 비상근무자에게 다음날 휴식 보장',
 null, '신규',
 null,null,
 null,null,
 null,null,null,
 null,null,
 '검토중');

-- =========================================================
-- 6단계: 가상 사업장 현장실효성 회신 (요구안별 1~3건)
-- =========================================================
insert into workplace_reviews (demand_id, workplace_name, current_status, feasibility, opinion)
values
((select id from demands where demand_no='2026-01'),'가상 A사업소','연차 사용률 70% 수준','조건부','대체인력 확보 시 가능'),
((select id from demands where demand_no='2026-01'),'가상 B사업소','교대근무로 연차 사용이 어려움','곤란','교대 인력 부족'),
((select id from demands where demand_no='2026-01'),'가상 C사업소','연차 사용 원활','가능','운영상 문제 없음'),

((select id from demands where demand_no='2026-02'),'가상 A사업소','대학원 재학 자녀 직원 소수','가능','대상 인원이 적어 부담 낮음'),
((select id from demands where demand_no='2026-02'),'가상 B사업소','해당 직원 없음','가능','의견 없음'),

((select id from demands where demand_no='2026-03'),'가상 A사업소','유연근무 신청 월 평균 5건','가능','절차 간소화 찬성'),
((select id from demands where demand_no='2026-03'),'가상 B사업소','민원 창구 운영 중','조건부','창구 최소인원 유지 조건'),
((select id from demands where demand_no='2026-03'),'가상 C사업소','유연근무 활용 저조','가능','활용 확대 기대'),

((select id from demands where demand_no='2026-04'),'가상 A사업소','현재 노조 참여 없음','곤란','심사 공정성 논란 우려'),
((select id from demands where demand_no='2026-04'),'가상 C사업소','해당 없음','곤란','본사 차원 결정 사항'),

((select id from demands where demand_no='2026-05'),'가상 B사업소','현 면제자 근무 사업장','조건부','대체인력 지원 필요'),

((select id from demands where demand_no='2026-06'),'가상 A사업소','직급별 보조비 차등 운영','조건부','예산 확보 전제'),

((select id from demands where demand_no='2026-07'),'가상 A사업소','장기 병가자 연 2명','가능','운영 영향 적음'),
((select id from demands where demand_no='2026-07'),'가상 C사업소','소규모 인원으로 공백 영향 큼','조건부','대체인력 필요'),

((select id from demands where demand_no='2026-08'),'가상 B사업소','건강검진 수검률 높음','가능','직원 만족도 향상 예상'),
((select id from demands where demand_no='2026-08'),'가상 C사업소','검진기관 접근성 낮음','조건부','지정 검진기관 확대 필요'),

((select id from demands where demand_no='2026-09'),'가상 A사업소','희망지 조사 이미 시행','가능','현행과 유사'),
((select id from demands where demand_no='2026-09'),'가상 B사업소','특정 사업장 희망 쏠림','조건부','비선호 사업장 인력 확보 방안 필요'),
((select id from demands where demand_no='2026-09'),'가상 C사업소','순환근무 원칙 운영','조건부','순환 원칙과 병행 필요'),

((select id from demands where demand_no='2026-10'),'가상 B사업소','야간 비상근무 월 4회','조건부','익일 업무 조정 필요');

-- 확인용
select demand_no, title, status from demands order by demand_no;
