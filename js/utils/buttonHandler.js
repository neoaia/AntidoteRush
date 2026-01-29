function checkIfMouseIsOverButton(buttonX, buttonY, buttonWidth, buttonHeight) {
  let mouseIsRightOfLeft = mouseX > buttonX;
  let mouseIsLeftOfRight = mouseX < buttonX + buttonWidth;
  let mouseIsInHorizontalBounds = mouseIsRightOfLeft && mouseIsLeftOfRight;

  let mouseIsBelowTop = mouseY > buttonY;
  let mouseIsAboveBottom = mouseY < buttonY + buttonHeight;
  let mouseIsInVerticalBounds = mouseIsBelowTop && mouseIsAboveBottom;

  let mouseIsOverButton = mouseIsInHorizontalBounds && mouseIsInVerticalBounds;

  return mouseIsOverButton;
}
