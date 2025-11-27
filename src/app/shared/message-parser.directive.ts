import { Directive, ElementRef, Input, OnChanges, SimpleChanges, ViewContainerRef, ComponentRef } from '@angular/core';
import { PolizzaCardComponent, PolizzaData } from './polizza-card.component';

@Directive({
  selector: '[appMessageParser]',
  standalone: true
})
export class MessageParserDirective implements OnChanges {
  @Input() appMessageParser: string = '';

  private cardRefs: ComponentRef<PolizzaCardComponent>[] = [];

  constructor(
    private el: ElementRef,
    private viewContainer: ViewContainerRef
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['appMessageParser']) {
      this.parseMessage();
    }
  }

  private parseMessage() {
    // Pulisci card precedenti
    this.cardRefs.forEach(ref => ref.destroy());
    this.cardRefs = [];

    const text = this.appMessageParser;
    
    // Regex per trovare :::polizza ...:::
    const polizzaRegex = /:::polizza\s+([\s\S]*?):::/gi;
    let match;
    let lastIndex = 0;
    let resultHtml = '';

    while ((match = polizzaRegex.exec(text)) !== null) {
      // Aggiungi testo prima della card
      resultHtml += this.escapeHtml(text.substring(lastIndex, match.index));
      
      // Parsa i dati della polizza
      const polizzaData = this.parsePolizzaData(match[1]);
      
      // Aggiungi placeholder per la card
      const cardId = `polizza-card-${Date.now()}-${Math.random()}`;
      resultHtml += `<div id="${cardId}" class="card-placeholder"></div>`;
      
      lastIndex = match.index + match[0].length;

      // Crea la card dopo il render
      setTimeout(() => {
        const placeholder = this.el.nativeElement.querySelector(`#${cardId}`);
        if (placeholder) {
          const cardRef = this.viewContainer.createComponent(PolizzaCardComponent);
          cardRef.instance.data = polizzaData;
          placeholder.appendChild(cardRef.location.nativeElement);
          this.cardRefs.push(cardRef);
        }
      }, 0);
    }

    // Aggiungi testo rimanente
    resultHtml += this.escapeHtml(text.substring(lastIndex));

    this.el.nativeElement.innerHTML = resultHtml;
  }

  private parsePolizzaData(content: string): PolizzaData {
    const data: PolizzaData = {};
    
    // Pattern per estrarre chiave: valore
    const patterns: { [key: string]: RegExp } = {
      tipo: /tipo:\s*([^,\n]+?)(?=\s+\w+:|$)/i,
      numero: /numero:\s*([^,\n]+?)(?=\s+\w+:|$)/i,
      intestatario: /intestatario:\s*([^,\n]+?)(?=\s+\w+:|$)/i,
      veicolo: /veicolo:\s*([^,\n]+?)(?=\s+\w+:|$)/i,
      scadenza: /scadenza:\s*([^,\n]+?)(?=\s+\w+:|$)/i,
      premio: /premio:\s*([^,\n]+?)(?=\s+\w+:|$)/i,
      coperture: /coperture:\s*([^,\n]+?)(?=\s+stato:|$)/i,
      stato: /stato:\s*(\w+)/i
    };

    for (const [key, regex] of Object.entries(patterns)) {
      const match = content.match(regex);
      if (match) {
        if (key === 'coperture') {
          data.coperture = match[1].split(',').map(c => c.trim());
        } else {
          (data as any)[key] = match[1].trim();
        }
      }
    }

    return data;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}