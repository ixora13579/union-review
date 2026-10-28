# CLAUDE.md

## 언어 규칙

- 모든 답변과 화면 문구는 한국어로 작성한다.

@AGENTS.md

## DB 구조

- DB 구조(테이블, 컬럼, 허용 값, RLS 정책)는 `supabase/schema.sql`을 기준으로 참고한다.
- 이 파일은 실행하면 기존 테이블을 삭제(`drop table`)하고 다시 만든다. 함부로 실행하지 않는다.
