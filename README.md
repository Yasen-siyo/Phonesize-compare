# 실제 크기 폰 비교

화면을 신용카드(또는 500원 동전, 자)로 한 번 보정한 뒤, 주요 스마트폰을 실제 크기로 나란히 또는 겹쳐서 비교하는 정적 웹사이트입니다.

## 개발

```bash
npm install
npm run dev      # 개발 서버
npm run build    # dist/ 에 정적 파일 생성
```

## 구조

- `src/data/devices/*.json` — 기기 1종당 JSON 1개 (단위 mm, `src/types.ts` 참고)
- `src/lib/calibration.ts` — 보정값(pxPerMm) 저장·복원, 브라우저 확대 변화 환산
- `src/lib/detect.ts` — 방문자 기기 자동 추정 (Android Client Hints, iOS 화면 크기)
- `src/lib/geometry.ts` — 화면 크기 계산, 둥근 모서리 SVG 경로
- `src/components/` — 보정 화면, 비교 화면, 기기 SVG

## 데이터 신뢰도

본체 크기·두께·화면 대각선·해상도는 제조사 공식값입니다. 모서리 반경과 카메라 구멍 크기·위치는 아직 추정값이며 `confidence` 필드에 표시되지 않은 항목은 모두 추정값으로 봅니다.

## 배포

`main`에 push하면 GitHub Actions(`.github/workflows/deploy.yml`)가 빌드해서 GitHub Pages에 올립니다.
처음 한 번은 저장소 Settings → Pages → Build and deployment → Source를 **GitHub Actions**로 바꿔야 합니다.
