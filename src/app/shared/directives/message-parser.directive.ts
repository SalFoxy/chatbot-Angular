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
      setTimeout(() => this.parseMessage(), 0);
    }
  }

  private parseMessage() {
    // Pulisci card precedenti
    this.cardRefs.forEach(ref => ref.destroy());
    this.cardRefs = [];

    const text = this.appMessageParser || '';
    
    // Regex per trovare :::polizza ... :::
    const polizzaRegex = /:::polizza\s+([\s\S]*?):::/gi;
    
    const fragments: { type: 'text' | 'card', content: string, data?: PolizzaData }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = polizzaRegex.exec(text)) !== null) {
      // Testo prima della card
      if (match.index > lastIndex) {
        fragments.push({ 
          type: 'text', 
          content: text.substring(lastIndex, match.index) 
        });
      }
      
      // Card
      const polizzaData = this.parsePolizzaData(match[1]);
      fragments.push({ 
        type: 'card', 
        content: '', 
        data: polizzaData 
      });
      
      lastIndex = match.index + match[0].length;
    }

    // Testo rimanente
    if (lastIndex < text.length) {
      fragments.push({ 
        type: 'text', 
        content: text.substring(lastIndex) 
      });
    }

    // Costruisci HTML
    this.el.nativeElement.innerHTML = '';
    
    fragments.forEach((fragment, index) => {
      if (fragment.type === 'text' && fragment.content.trim()) {
        const textEl = document.createElement('p');
        textEl.textContent = fragment.content.trim();
        textEl.style.marginBottom = '12px';
        this.el.nativeElement.appendChild(textEl);
      } else if (fragment.type === 'card' && fragment.data) {
        const cardRef = this.viewContainer.createComponent(PolizzaCardComponent);
        cardRef.instance.data = fragment.data;
        this.el.nativeElement.appendChild(cardRef.location.nativeElement);
        this.cardRefs.push(cardRef);
      }
    });
  }

  private parsePolizzaData(content: string): PolizzaData {
    const data: PolizzaData = {};
    
    // Normalizza: rimuovi newline extra
    const normalized = content.replace(/\s+/g, ' ').trim();
    
    // Lista di campi da cercare (in ordine)
    const fields = ['tipo', 'numero', 'intestatario', 'veicolo', 'scadenza', 'premio', 'coperture', 'stato'];
    
    for (let i = 0; i < fields.length; i++) {
      const currentField = fields[i];
      const nextField = fields[i + 1];
      
      let regex: RegExp;
      if (nextField) {
        // Cerca da "campo:" fino al prossimo "campo:"
        regex = new RegExp(`${currentField}:\\s*(.+?)(?=\\s+${nextField}:|$)`, 'i');
      } else {
        // Ultimo campo: prendi tutto fino alla fine
        regex = new RegExp(`${currentField}:\\s*(.+)$`, 'i');
      }
      
      const match = normalized.match(regex);
      if (match) {
        const value = match[1].trim();
        
        if (currentField === 'coperture') {
          // Splitta per virgola
          data.coperture = value.split(',').map(c => c.trim()).filter(c => c);
        } else {
          (data as any)[currentField] = value;
        }
      }
    }
    
    console.log('Parsed polizza data:', data); // Debug
    return data;
  }
}