import spacetime from 'spacetime'

export function toTimestamp(strDate) {
    var datum = Date.parse(strDate);
    return datum / 1000;
}

export function convertTimestamp(timestamp) {
  let now = spacetime.now()
  let offset = now.offset()
  return timestamp + offset*60
}

export function makeRequest(method, url, query) {
    return new Promise(function(resolve, reject) {
      let xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      xhr.responseType = 'json';
      xhr.onload = function() {
        if (this.status >= 200 && this.status < 300) {
          resolve(xhr.response);
        } else {
          console.log(xhr.statusText)
          reject({
            status: this.status,
            statusText: xhr.statusText
          });
        }
      };
      xhr.onerror = function() {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      };
  
      xhr.send(query);
    });
}

export function sortByKey(array, key, reverse=false)
{
 return array.sort(function(a, b)
 {
  var x = a[key]; var y = b[key];
  let result = ((x < y) ? -1 : ((x > y) ? 1 : 0));
  return (reverse ? (result * -1) : result)
 });
}