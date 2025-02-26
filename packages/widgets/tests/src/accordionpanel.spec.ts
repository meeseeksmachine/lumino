// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { every } from '@lumino/algorithm';
import { MessageLoop } from '@lumino/messaging';
import {
  AccordionLayout,
  AccordionPanel,
  Title,
  Widget
} from '@lumino/widgets';
import { expect } from 'chai';
import { simulate } from 'simulate-event';

const renderer: AccordionPanel.IRenderer = {
  titleClassName: '.lm-AccordionTitle',
  createHandle: () => document.createElement('div'),
  createSectionTitle: (title: Title<Widget>) => document.createElement('h3')
};

class LogAccordionPanel extends AccordionPanel {
  events: string[] = [];

  handleEvent(event: Event): void {
    super.handleEvent(event);
    this.events.push(event.type);
  }
}

describe('@lumino/widgets', () => {
  describe('AccordionPanel', () => {
    describe('#constructor()', () => {
      it('should accept no arguments', () => {
        let panel = new AccordionPanel();
        expect(panel).to.be.an.instanceof(AccordionPanel);
      });

      it('should accept options', () => {
        let panel = new AccordionPanel({
          orientation: 'horizontal',
          spacing: 5,
          titleSpace: 42,
          renderer
        });
        expect(panel.orientation).to.equal('horizontal');
        expect(panel.spacing).to.equal(5);
        expect(panel.titleSpace).to.equal(42);
        expect(panel.renderer).to.equal(renderer);
      });

      it('should accept a layout option', () => {
        let layout = new AccordionLayout({ renderer });
        let panel = new AccordionPanel({ layout });
        expect(panel.layout).to.equal(layout);
      });

      it('should ignore other options if a layout is given', () => {
        let ignored = Object.create(renderer);
        let layout = new AccordionLayout({ renderer });
        let panel = new AccordionPanel({
          layout,
          orientation: 'horizontal',
          spacing: 5,
          titleSpace: 42,
          renderer: ignored
        });
        expect(panel.layout).to.equal(layout);
        expect(panel.orientation).to.equal('vertical');
        expect(panel.spacing).to.equal(4);
        expect(panel.titleSpace).to.equal(22);
        expect(panel.renderer).to.equal(renderer);
      });

      it('should add the `lm-AccordionPanel` class', () => {
        let panel = new AccordionPanel();
        expect(panel.hasClass('lm-AccordionPanel')).to.equal(true);
      });
    });

    describe('#dispose()', () => {
      it('should dispose of the resources held by the panel', () => {
        let panel = new LogAccordionPanel();
        let layout = panel.layout as AccordionLayout;
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          panel.addWidget(w);
        });
        Widget.attach(panel, document.body);

        panel.dispose();

        expect(every(widgets, w => w.isDisposed));
        expect(layout.titles).to.have.length(0);
      });
    });

    describe('#titleSpace', () => {
      it('should default to `22`', () => {
        let panel = new AccordionPanel();
        expect(panel.titleSpace).to.equal(22);
      });

      it('should set the titleSpace for the panel', () => {
        let panel = new AccordionPanel();
        panel.titleSpace = 10;
        expect(panel.titleSpace).to.equal(10);
      });
    });

    describe('#renderer', () => {
      it('should get the renderer for the panel', () => {
        let panel = new AccordionPanel({ renderer });
        expect(panel.renderer).to.equal(renderer);
      });
    });

    describe('#titles', () => {
      it('should get the read-only sequence of the accordion titles in the panel', () => {
        let panel = new AccordionPanel();
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          panel.addWidget(w);
        });
        expect(panel.titles.length).to.equal(widgets.length);
      });

      it('should update the title element', () => {
        const text = 'Something';
        let panel = new AccordionPanel();
        let widget = new Widget();
        panel.addWidget(widget);
        widget.title.label = text;
        const el = panel.titles[0].querySelector(
          '.lm-AccordionPanel-titleLabel'
        )!;
        expect(el.textContent).to.equal(text);
      });
    });

    describe('#handleEvent()', () => {
      let panel: LogAccordionPanel;
      let layout: AccordionLayout;

      beforeEach(() => {
        panel = new LogAccordionPanel();
        layout = panel.layout as AccordionLayout;
        let widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => {
          panel.addWidget(w);
        });
        panel.setRelativeSizes([10, 10, 10, 20]);
        Widget.attach(panel, document.body);
        MessageLoop.flush();
      });

      afterEach(() => {
        panel.dispose();
      });

      context('click', () => {
        it('should collapse an expanded widget', () => {
          simulate(layout.titles[0], 'click');
          expect(panel.events).to.contain('click');

          expect(layout.titles[0].getAttribute('aria-expanded')).to.equal(
            'false'
          );
          expect(layout.titles[0].classList.contains('lm-mod-expanded')).to.be
            .false;
          expect(layout.widgets[0].isHidden).to.be.true;
        });

        it('should expand a collapsed widget', () => {
          // Collapse
          simulate(layout.titles[0], 'click');

          simulate(layout.titles[0], 'click');

          expect(layout.titles[0].getAttribute('aria-expanded')).to.equal(
            'true'
          );
          expect(layout.titles[0].classList.contains('lm-mod-expanded')).to.be
            .true;
          expect(layout.widgets[0].isHidden).to.be.false;
        });
      });

      context('keydown', () => {
        it('should redirect to toggle expansion state if Space is pressed', () => {
          simulate(layout.titles[0], 'keydown', { key: 'Space' });
          expect(panel.events).to.contain('keydown');

          expect(layout.titles[0].getAttribute('aria-expanded')).to.equal(
            'false'
          );
          expect(layout.titles[0].classList.contains('lm-mod-expanded')).to.be
            .false;
          expect(layout.widgets[0].isHidden).to.be.true;

          simulate(layout.titles[0], 'keydown', { key: 'Space' });
          expect(panel.events).to.contain('keydown');

          expect(layout.titles[0].getAttribute('aria-expanded')).to.equal(
            'true'
          );
          expect(layout.titles[0].classList.contains('lm-mod-expanded')).to.be
            .true;
          expect(layout.widgets[0].isHidden).to.be.false;
        });

        it('should redirect to toggle expansion state if Enter is pressed', () => {
          simulate(layout.titles[0], 'keydown', { key: 'Enter' });
          expect(panel.events).to.contain('keydown');

          expect(layout.titles[0].getAttribute('aria-expanded')).to.equal(
            'false'
          );
          expect(layout.titles[0].classList.contains('lm-mod-expanded')).to.be
            .false;
          expect(layout.widgets[0].isHidden).to.be.true;

          simulate(layout.titles[0], 'keydown', { key: 'Enter' });
          expect(panel.events).to.contain('keydown');

          expect(layout.titles[0].getAttribute('aria-expanded')).to.equal(
            'true'
          );
          expect(layout.titles[0].classList.contains('lm-mod-expanded')).to.be
            .true;
          expect(layout.widgets[0].isHidden).to.be.false;
        });

        it('should focus on the next widget if Arrow Down is pressed', () => {
          layout.titles[1].focus();

          simulate(layout.titles[1], 'keydown', { key: 'ArrowDown' });
          expect(panel.events).to.contain('keydown');

          expect(document.activeElement).to.be.equal(layout.titles[2]);
        });

        it('should focus on the previous widget if Arrow Up is pressed', () => {
          layout.titles[1].focus();

          simulate(layout.titles[1], 'keydown', { key: 'ArrowUp' });
          expect(panel.events).to.contain('keydown');

          expect(document.activeElement).to.be.equal(layout.titles[0]);
        });

        it('should focus on the first widget if Home is pressed', () => {
          layout.titles[1].focus();

          simulate(layout.titles[1], 'keydown', { key: 'Home' });
          expect(panel.events).to.contain('keydown');

          expect(document.activeElement).to.be.equal(layout.titles[0]);
        });

        it('should focus on the last widget if End is pressed', () => {
          layout.titles[1].focus();

          simulate(layout.titles[1], 'keydown', { key: 'End' });
          expect(panel.events).to.contain('keydown');

          expect(document.activeElement).to.be.equal(layout.titles[2]);
        });
      });
    });

    describe('#onBeforeAttach()', () => {
      it('should attach a click listener to the node', () => {
        let panel = new LogAccordionPanel();
        Widget.attach(panel, document.body);
        simulate(panel.node, 'click');
        expect(panel.events).to.contain('click');
        panel.dispose();
      });

      it('should attach a keydown listener to the node', () => {
        let panel = new LogAccordionPanel();
        Widget.attach(panel, document.body);
        simulate(panel.node, 'keydown');
        expect(panel.events).to.contain('keydown');
        panel.dispose();
      });
    });

    describe('#onAfterDetach()', () => {
      it('should remove click listener', () => {
        let panel = new LogAccordionPanel();
        Widget.attach(panel, document.body);
        simulate(panel.node, 'click');
        expect(panel.events).to.contain('click');

        Widget.detach(panel);

        panel.events = [];
        simulate(panel.node, 'click');
        expect(panel.events).to.not.contain('click');
      });

      it('should remove keydown listener', () => {
        let panel = new LogAccordionPanel();
        Widget.attach(panel, document.body);
        simulate(panel.node, 'keydown');
        expect(panel.events).to.contain('keydown');

        Widget.detach(panel);

        panel.events = [];
        simulate(panel.node, 'keydown');
        expect(panel.events).to.not.contain('keydown');
      });
    });

    describe('.Renderer()', () => {
      describe('.defaultRenderer', () => {
        it('should be an instance of `Renderer`', () => {
          expect(AccordionPanel.defaultRenderer).to.be.an.instanceof(
            AccordionPanel.Renderer
          );
        });
      });

      describe('#constructor', () => {
        it('should create a section title', () => {
          const renderer = new AccordionPanel.Renderer();

          expect(
            renderer.createSectionTitle(
              new Title<Widget>({ owner: new Widget() })
            )
          ).to.be.instanceOf(HTMLElement);
        });

        it('should have a section title selector', () => {
          const renderer = new AccordionPanel.Renderer();

          expect(renderer.titleClassName).to.be.equal(
            'lm-AccordionPanel-title'
          );
        });
      });
    });

    describe('#_computeWidgetSize()', () => {
      const DELTA = 1e-6;
      let panel: AccordionPanel;
      beforeEach(() => {
        panel = new AccordionPanel({ renderer, titleSpace: 0, spacing: 0 });
        panel.node.style.height = '500px';
        Widget.attach(panel, document.body);
      });
      it('should not compute the size of panel with only one widget', () => {
        panel.addWidget(new Widget());
        MessageLoop.flush();
        const value = panel['_computeWidgetSize'](0);
        expect(value).to.be.equal(undefined);
      });
      it('should compute the size of panel with two opened widgets', () => {
        const widgets = [new Widget(), new Widget()];
        widgets.forEach(w => panel.addWidget(w));
        MessageLoop.flush();
        const value0 = panel['_computeWidgetSize'](0);
        expect(value0.length).to.be.equal(2);
        expect(value0[0]).to.be.closeTo(0, DELTA);
        expect(value0[1]).to.be.closeTo(1, DELTA);
        const value1 = panel['_computeWidgetSize'](1);
        expect(value1[0]).to.be.closeTo(1, DELTA);
        expect(value1[1]).to.be.closeTo(0, DELTA);
      });
      it('should compute the size of panel with three widgets', () => {
        const widgets = [new Widget(), new Widget(), new Widget()];
        widgets.forEach(w => panel.addWidget(w));
        MessageLoop.flush();

        const value = panel['_computeWidgetSize'](0);
        expect(value.length).to.be.equal(3);
        expect(value[0]).to.be.closeTo(0, DELTA);
        expect(value[1]).to.be.closeTo(0.333333, DELTA);
        expect(value[2]).to.be.closeTo(0.666666, DELTA);
      });
    });
  });
});
