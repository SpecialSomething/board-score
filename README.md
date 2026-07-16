# 🎲 Board Score

Board Score는 여러 트릭 테이킹 카드게임의 점수를 쉽고 빠르게 기록하기 위한 웹 애플리케이션입니다.

현재는 **Skull King**을 지원하며, 앞으로 **Tichu**, **Wizard** 등 다양한 게임을 추가할 예정입니다.

---

## ✨ Features

### 🏴 Skull King

- 2~8명 플레이 지원
- 라운드별 예측(Bid) / 실제 획득(Tricks) 입력
- Skull King 공식 점수 계산
- 보너스 점수 입력
  - 일반색 14
  - 검은색 14
  - 해적 → 인어
  - 스컬 킹 → 해적
  - 인어 → 스컬 킹
- 누적 점수 및 공동 순위 계산
- 라운드 기록 확인
- 게임 종료 후 최종 결과 확인
- 같은 플레이어로 즉시 재시작(한 판 더?)
- 진행 중 게임 자동 저장 및 이어하기

---

## 📱 Screenshots

> (나중에 스크린샷 추가)

- Home
- Game Setup
- Game Playing
- Result

---

## 🛠 Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Vitest

---

## 📂 Project Structure

```
src/
├── app/
│   └── games/
│       └── skull-king/
│
├── features/
│   └── skull-king/
│       ├── components/
│       │   ├── BinarySelector.tsx
│       │   ├── BonusSection.tsx
│       │   ├── Header.tsx
│       │   ├── NumberSelector.tsx
│       │   ├── PlayerCard.tsx
│       │   ├── RoundForm.tsx
│       │   └── RoundHistory.tsx
│       │
│       ├── constants.ts
│       ├── factories.ts
│       ├── scoring.ts
│       ├── standings.ts
│       ├── storage.ts
│       └── types.ts
```

---

## 🚀 Getting Started

### Install

```bash
npm install
```

### Run

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Test

```bash
npm run test:run
```

---

## 🎯 Roadmap

### Completed

- [x] Home 화면
- [x] Skull King 게임 설정
- [x] 점수 입력 화면
- [x] 결과 화면
- [x] 자동 저장
- [x] 이어하기
- [x] 공동 순위 계산

### Planned

- [ ] Tichu 지원
- [ ] Wizard 지원
- [ ] 통계 화면
- [ ] 다크 모드
- [ ] PWA 지원

---

## 📄 License

This project is licensed under the MIT License.