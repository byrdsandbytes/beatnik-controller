import { Component, ElementRef, ViewChild } from '@angular/core';
import { GestureController } from '@ionic/angular';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage {

  isModalOpen = true;

  @ViewChild('bottomSheet') bottomSheet!: ElementRef;

  private gesture?: any;

  /** --- Breakpoint settings --- */
  private readonly minHeightPx   = 160;  // collapsed height (always visible)
  private readonly maxHeightRatio = 0.9; // expanded height = 90 % of screen

  /** Tracks current translateY so we can keep relative dragging */
  private currentY = 0;

  constructor(private gestureCtrl: GestureController) {}

  openModal()  { this.isModalOpen = true; }
  closeModal() { this.isModalOpen = false; }

  ngAfterViewInit() {
    this.createDragGesture();
  }

  private createDragGesture() {
    const sheet = this.bottomSheet?.nativeElement;
    if (!sheet) { return; }

    /* Calculate the two breakpoint positions --------------------------------*/
    const screenHeight   = window.innerHeight;
    const maxHeight      = screenHeight * this.maxHeightRatio;         // 90 % of screen
    const collapsedY     = maxHeight - this.minHeightPx;               // translateY when collapsed
    this.currentY        = collapsedY;                                 // start collapsed
    sheet.style.transform = `translateY(${collapsedY}px)`;

    /* Build the gesture ------------------------------------------------------*/
    const gesture = this.gestureCtrl.create({
      el: sheet,
      gestureName: 'drag-bottom-sheet',
      threshold: 0,

      onMove: ev => {
        /* Clamp the sheet so it never goes above 0 (fully open)
           or below collapsedY (fully collapsed)                          */
        const newY = Math.min(collapsedY, Math.max(0, ev.deltaY + this.currentY));
        sheet.style.transform = `translateY(${newY}px)`;
      },

      onEnd: ev => {
        /* Decide which breakpoint is closer after the drag finishes --------*/
        const endY      = ev.deltaY + this.currentY;
        const snapPoint = endY < collapsedY / 2 ? 0 : collapsedY;   // 0 = fully open
        this.currentY   = snapPoint;

        sheet.style.transition = 'transform 0.25s ease-out';
        sheet.style.transform  = `translateY(${snapPoint}px)`;
        /* Remove the transition after it completes to keep dragging smooth */
        setTimeout(() => sheet.style.transition = '', 250);
      }
    });

    gesture.enable(true);
    this.gesture = gesture;
  }
}
