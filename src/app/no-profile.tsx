// 로그인은 했지만 profiles 에 역할이 등록되지 않은 계정에게 보여주는 안내
export function NoProfile() {
  return (
    <p className="rounded-lg bg-yellow-50 p-4 text-yellow-800">
      권한이 설정되지 않은 계정입니다. 관리자에게 문의하세요.
    </p>
  );
}
