/* The enrolled service owns the questions, saved files and attempts. Paginate its teaching
   material after it mounts a new lesson, keeping the service's existing action button. */
const main = document.querySelector('main#main');
const source = document.getElementById('course-data');
if (main && source) {
  const courses = JSON.parse(source.textContent);
  const teachingSlides = () => {
    const match = /^#course-([123])$/.exec(location.hash);
    const advance = main.querySelector('#advance');
    if (!match || !advance || main.querySelector('fcs-slide-deck')) return;
    const course = courses[Number(match[1])-1];
    const steps = main.querySelector('.steps');
    if (!course || !steps) return;
    const deck = document.createElement('fcs-slide-deck');
    deck.setAttribute('aria-label',course.title);
    const add = (title, text) => {
      const panel=document.createElement('section');
      panel.setAttribute('data-slide','');
      const heading=document.createElement('h2');
      heading.textContent=title;
      const paragraph=document.createElement('p');
      paragraph.textContent=text;
      panel.append(heading,paragraph);
      deck.append(panel);
      return panel;
    };
    add(course.title,course.objective + ' ' + course.anchor);
    add('On the floor',course.scene);
    for (const [,title,body] of course.teach) add(title,body);
    const model=add('Say it out loud',course.model);
    advance.textContent='Start case questions';
    model.append(advance);
    while (steps.nextElementSibling) steps.nextElementSibling.remove();
    steps.textContent='Lesson slides · Case questions at the end';
    steps.after(deck);
  };
  new MutationObserver(teachingSlides).observe(main,{childList:true});
  teachingSlides();
}
