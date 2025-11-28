import { Directive, ElementRef, AfterViewInit, OnDestroy, Input } from '@angular/core';

@Directive({
  selector: '[appCollapsibleSections]',
  standalone: true
})
export class CollapsibleSectionsDirective implements AfterViewInit, OnDestroy {
  @Input() appCollapsibleSections: boolean = true;
  
  private observer: MutationObserver | null = null;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    // Osserva i cambiamenti nel contenuto (per lo streaming)
    this.observer = new MutationObserver(() => {
      this.processHeadings();
    });

    this.observer.observe(this.el.nativeElement, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Prima elaborazione
    setTimeout(() => this.processHeadings(), 100);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  private processHeadings() {
    if (! this.appCollapsibleSections) return;

    const container = this.el.nativeElement;
    const headings = container.querySelectorAll('h1, h2, h3, h4');

    headings.forEach((heading: HTMLElement) => {
      // Salta se già processato
      if (heading.classList.contains('collapsible-heading')) return;
      
      // Salta se non ha contenuto dopo
      const content = this.getContentUntilNextHeading(heading);
      if (!content.length) return;

      // Marca come processato
      heading.classList.add('collapsible-heading');
      
      // Crea wrapper per il contenuto
      const wrapper = document.createElement('div');
      wrapper.className = 'collapsible-content open';
      
      // Sposta il contenuto nel wrapper
      content.forEach(node => {
        wrapper.appendChild(node);
      });

      // Inserisci wrapper dopo l'heading
      heading.after(wrapper);

      // Aggiungi icona toggle
      const icon = document.createElement('i');
      icon.className = 'bi bi-chevron-down collapsible-icon';
      heading.insertBefore(icon, heading.firstChild);

      // Event listener per toggle
      heading.addEventListener('click', () => {
        const isOpen = wrapper.classList.contains('open');
        
        wrapper.classList.toggle('open');
        wrapper.classList.toggle('closed');
        icon.classList.toggle('bi-chevron-down', ! isOpen);
        icon.classList.toggle('bi-chevron-right', isOpen);
        heading.classList.toggle('collapsed', isOpen);
      });
    });
  }

  private getContentUntilNextHeading(heading: HTMLElement): Node[] {
    const content: Node[] = [];
    let sibling = heading.nextSibling;
    const headingLevel = parseInt(heading.tagName[1]);

    while (sibling) {
      // Se è un elemento
      if (sibling.nodeType === Node.ELEMENT_NODE) {
        const el = sibling as HTMLElement;
        
        // Ferma se troviamo un heading di livello uguale o superiore
        if (/^H[1-4]$/.test(el.tagName)) {
          const siblingLevel = parseInt(el.tagName[1]);
          if (siblingLevel <= headingLevel) break;
        }
        
        // Ferma se già processato
        if (el.classList.contains('collapsible-content')) break;
      }

      const next = sibling.nextSibling;
      content.push(sibling);
      sibling = next;
    }

    return content;
  }
}