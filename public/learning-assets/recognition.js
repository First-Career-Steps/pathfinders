const app = 'https://apps.apple.com/us/app/leadership-rhythm/id6762418274';
const examples = {
  restaurant: {
    title:'Catch someone doing it right',
    situation:'A teammate checks a pickup ticket and stops a duplicate remake before it reaches the oven. What would you say to them in the moment?',
    model:'“You checked the ticket before firing that second pizza. That kept the oven free and helped us get the right order to the guest.”',
    apply:'On your next shift, choose one busy stretch. At each check-in, look for a specific action worth naming. After the rush, jot down what you noticed, what you said and one opportunity you missed.'
  },
  coaching: {
    title:'Recognize a useful review habit',
    situation:'A preparer ties the reconciliation to its source and flags an unexplained difference before you open the file. What would you say to encourage that habit?',
    model:'“You flagged that difference and attached the source before review. I could trace the balance straight away and spend our meeting on the unresolved item.”',
    apply:'After your next file review, name one action that made the work easier to verify. Write down your exact words and check the next file for the same habit.'
  }
};
export function recognitionPractice(track) {
  const example = examples[track];
  return '<section id="recognition" class="focus box recognition"><p class="eyebrow">Optional practice · Leadership Rhythm</p><h2>'+example.title+'</h2><p>'+example.situation+'</p>'+
    '<label class="label" for="recognition-note">Write the words you would actually use</label><textarea class="write" id="recognition-note" rows="3" placeholder="Name the action and its effect."></textarea>'+
    '<p class="mini">This practice note stays on this page. You can also do the exercise on paper.</p><details><summary>Compare with a worked example</summary><p>'+example.model+'</p></details>'+
    '<h3>Try it at work</h3><p>'+example.apply+'</p><p><a class="textlink" href="'+app+'" target="_blank" rel="noopener noreferrer">Open Leadership Rhythm on the App Store</a> for optional timed reminders.</p></section>';
}
