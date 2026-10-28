function required(value: string | undefined) {
  if (!value) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_ANON_KEY 를 .env.local 에 설정하세요.",
    );
  }
  return value;
}

// NEXT_PUBLIC_ 변수는 빌드 때 값이 박히므로 process.env.이름 을 그대로 써야 한다
export const supabaseUrl = required(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseAnonKey = required(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
