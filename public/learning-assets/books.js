const escapeText = text => String(text ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const labels = {pending:'Awaiting shipment',shipped:'Shipped',needs_address:'Address needs review'};
const usd = cents => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(cents/100);

export function offer(state){
  const paid=state.stage==='paid';
  const price=usd(state.priceCents??4900);
  return '<div class="card bundle"><div class="eyebrow">Course and book</div><h3>'+price+' <small>per enrollment</small></h3><p>The paid edition includes the interactive course, immediate handbook PDF, and one paperback with U.S. standard shipping. Earn a printable, LinkedIn-ready certificate by passing the assessment.</p>'+(paid?'':'<p class="mini">The free pilot includes the digital handbook.</p>')+'<a class="textlink" href="#sample">Preview the certificate</a></div>';
}
export function downloads(state,base='/api/education/'){
  return state.entitled?'<article class="card tint"><h3>Your handbook</h3><p>Download the complete first edition of <em>The Little Black Book on Leadership</em> by Brenen Morse.</p><a class="cta" href="'+escapeText(base)+'handbook.pdf" download>Download the book (PDF)</a></article>':'';
}
export async function shippingStatus(container,api){
  try{
    const {orders}=await api('book');
    if(!container.isConnected || !orders.length)return;
    container.innerHTML='<h3>Your book order</h3>'+orders.map(o=>'<p>'+escapeText(labels[o.status]||o.status)+(o.tracking?' · Dispatch reference '+escapeText(o.tracking):'')+'</p>').join('');
    container.hidden=false;
  }catch(e){
    if(container.isConnected){container.textContent='Book order status is unavailable. Refresh to try again.';container.hidden=false;}
  }
}
export async function booksDesk(root,api,status='pending',after=''){
  const search=new URLSearchParams({status});if(after)search.set('after',after);
  const {orders,nextAfter}=await api('operator/books?'+search);
  const address=a=>[a?.line1,a?.line2,a?.city,a?.state,a?.postal_code,a?.country].filter(Boolean).map(escapeText).join(', ');
  root.innerHTML='<div class="focus"><a class="crumb" href="#details">Course administration</a><div class="sectionhead"><h1>Book fulfillment</h1><p>One paperback per eligible paid enrollment. Mark a book shipped after handing it to the carrier.</p></div><div class="row">'+Object.entries(labels).map(([k,v])=>'<a class="'+(status===k?'cta':'outline')+'" href="#books/'+k+'">'+v+'</a>').join('')+'</div><div class="space">'+(orders.length?orders.map(o=>'<article class="card"><div class="eyebrow">Order '+escapeText(o.id)+'</div><h3>'+escapeText(o.recipient||o.email||'Book order')+'</h3><p>'+address(o.address)+'<br>'+escapeText(o.email)+'</p>'+
  (status==='pending'?'<form class="dispatch" data-order="'+Number(o.id)+'"><label class="label">Tracking or dispatch reference<input required maxlength="150" class="write" name="tracking"></label><button class="primary">Mark shipped</button></form>':status==='shipped'?'<p>Dispatch reference · '+escapeText(o.tracking)+'</p>':'<form class="address" data-order="'+Number(o.id)+'">'+[['recipient','Recipient'],['line1','Street address'],['line2','Address line 2 (optional)'],['city','City'],['state','State'],['postal_code','ZIP code']].map(([name,label])=>'<label class="label">'+label+'<input class="write" name="'+name+'" '+(name==='line2'?'':'required')+'></label>').join('')+'<button class="primary">Save U.S. mailing address</button></form>')+'</article>').join(''):'<p>No orders in this list.</p>')+'</div>'+(nextAfter?'<button class="soft" id="nextOrders">Next page</button>':'')+'<div class="space"><button id="syncOrders" class="outline">Check payment confirmations</button></div><p id="dispatchMessage" role="status"></p></div>';
  root.querySelector('#syncOrders').onclick=async e=>{
    const btn=e.currentTarget;btn.disabled=true;
    try{
      let cursor=0,total=0;
      do{
        const batch=await api('operator/books/sync',{after:cursor});
        total+=batch.confirmed;cursor=batch.nextAfter;
      }while(cursor);
      await booksDesk(root,api,status);
      root.querySelector('#dispatchMessage').textContent=total+' payment confirmations recovered.';
    }catch(err){root.querySelector('#dispatchMessage').textContent=err.message;btn.disabled=false;}
  };
  const next=root.querySelector('#nextOrders');if(next)next.onclick=()=>booksDesk(root,api,status,nextAfter).catch(e=>root.querySelector('#dispatchMessage').textContent=e.message);
  root.querySelectorAll('form').forEach(form=>form.onsubmit=async e=>{
    e.preventDefault();const submit=e.submitter;submit.disabled=true;
    const id=Number(form.dataset.order),values=Object.fromEntries(new FormData(form));
    try{
      if(form.className==='dispatch')await api('operator/books/ship',{id,tracking:values.tracking.trim()});
      else{const {recipient,...address}=values;await api('operator/books/address',{id,recipient,address:{...address,country:'US'}});}
      await booksDesk(root,api,status,after);
    }catch(err){root.querySelector('#dispatchMessage').textContent=err.message;submit.disabled=false;}
  });
}
