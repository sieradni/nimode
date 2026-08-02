export function computeAttack(
  linesCleared: number,
  tSpin: boolean,
  tSpinMini: boolean,
): number {
  if (tSpinMini) {
    switch (linesCleared) {
      case 0:
        return 0;
      case 1:
        return 2;
      case 2:
        return 3;
      case 3:
        return 4;
      default:
        return 4;
    }
  }
  if (tSpin) {
    switch (linesCleared) {
      case 0:
        return 4;
      case 1:
        return 5;
      case 2:
        return 6;
      case 3:
        return 7;
      default:
        return 7;
    }
  }
  switch (linesCleared) {
    case 0:
      return 0;
    case 1:
      return 0;
    case 2:
      return 1;
    case 3:
      return 2;
    case 4:
      return 4;
    default:
      return 8;
  }
}
