import { Directive, ElementRef, Input, OnChanges, SimpleChanges, ViewContainerRef, ComponentRef } from '@angular/core';
import { PolizzaCardComponent, PolizzaData } from '../../features/chat/cards/polizza-card/polizza-card.component';
import { AlertCardComponent, AlertData } from '../../features/chat/cards/alert-card/alert-card.component';

@Directive({
  selector: '[appMessageParser]',
  standalone: true
})
export class MessageParserDirective implements OnChanges {
  @Input() appMessageParser: string = '';

  private cardRefs: ComponentRef<any>[] = [];

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
    
    // Regex per trovare tutti i blocchi
    const blockRegex = /:::(polizza|alert)\s+([\s\S]*?):::/gi;
    
    const fragments: { type: 'text' | 'polizza' | 'alert', content: string, data?: any }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = blockRegex.exec(text)) !== null) {
      // Testo prima del blocco
      if (match.index > lastIndex) {
        fragments.push({ 
          type: 'text', 
          content: text.substring(lastIndex, match.index) 
        });
      }
      
      const blockType = match[1].toLowerCase() as 'polizza' | 'alert';
      const blockContent = match[2];
      
      // Parsa i dati in base al tipo
      let data: any;
      if (blockType === 'polizza') {
        data = this.parsePolizzaData(blockContent);
      } else if (blockType === 'alert') {
        data = this.parseAlertData(blockContent);
      }
      
      fragments.push({ 
        type: blockType, 
        content: '', 
        data 
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
    
    fragments.forEach((fragment) => {
      if (fragment.type === 'text' && fragment.content.trim()) {
        const textEl = document.createElement('p');
        textEl.textContent = fragment.content.trim();
        textEl.style.marginBottom = '12px';
        this.el.nativeElement.appendChild(textEl);
      } else if (fragment.type === 'polizza' && fragment.data) {
        const cardRef = this.viewContainer.createComponent(PolizzaCardComponent);
        cardRef.instance.data = fragment.data;
        this.el.nativeElement.appendChild(cardRef.location.nativeElement);
        this.cardRefs.push(cardRef);
      } else if (fragment.type === 'alert' && fragment.data) {
        const cardRef = this.viewContainer.createComponent(AlertCardComponent);
        cardRef.instance.data = fragment.data;
        this.el.nativeElement.appendChild(cardRef.location.nativeElement);
        this.cardRefs.push(cardRef);
      }
    });
  }

  private parsePolizzaData(content: string): PolizzaData {
    const data: PolizzaData = {};
    const normalized = content.replace(/\s+/g, ' ').trim();
    
    const fields = ['tipo', 'numero', 'intestatario', 'veicolo', 'scadenza', 'premio', 'coperture', 'stato'];
    
    for (let i = 0; i < fields.length; i++) {
      const currentField = fields[i];
      const nextField = fields[i + 1];
      
      let regex: RegExp;
      if (nextField) {
        regex = new RegExp(`${currentField}:\\s*(.+?)(? =\\s+${nextField}:|$)`, 'i');
      } else {
        regex = new RegExp(`${currentField}:\\s*(.+)$`, 'i');
      }
      
      const match = normalized.match(regex);
      if (match) {
        const value = match[1].trim();
        
        if (currentField === 'coperture') {
          data.coperture = value.split(',').map(c => c.trim()).filter(c => c);
        } else {
          (data as any)[currentField] = value;
        }
      }
    }
    
    return data;
  }

  private parseAlertData(content: string): AlertData {
    const data: AlertData = {};
    const normalized = content.replace(/\s+/g, ' ').trim();
    
    const fields = ['tipo', 'titolo', 'messaggio', 'azione'];
    
    for (let i = 0; i < fields.length; i++) {
      const currentField = fields[i];
      const nextField = fields[i + 1];
      
      let regex: RegExp;
      if (nextField) {
        regex = new RegExp(`${currentField}:\\s*(.+?)(?=\\s+${nextField}:|$)`, 'i');
      } else {
        regex = new RegExp(`${currentField}:\\s*(.+)$`, 'i');
      }
      
      const match = normalized.match(regex);
      if (match) {
        (data as any)[currentField] = match[1].trim();
      }
    }
    
    return data;
  }
}