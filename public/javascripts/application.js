$(document).ready(function() {
  $(".preprocess-form").preprocessData(MapFormUpload.init());
  $("fieldset.location, fieldset.data, fieldset.title").sniffForCompletion();
  $("fieldset.location, fieldset.data").sniffForSubmittable(".actions button[type=submit]");
});

var MapFormUpload = {
  init: function() {
    this.automateTitleGuessing();
    this.displayColumnSamples();
    return this;
  },
  success: function(data) {
    console.log("SUCCESS!");
    console.log(data.column_names);
    console.log(data);

    var importSection = $(".import");
    var postSection = $(".post-process");
    importSection.markCompleted(true);
    postSection.slideDown();
    $("select.column-names").setColumnOptions(data.column_names, data.column_details);
    $("#map_original_csv_data").val(data.csv).change();
    $("#map_location_column_name").val(data.guessed_location_column).change();
    $("#map_data_column_name").val(data.guessed_data_column).change();
    $("#map_location_column_type").val(null).change();
    $("#map_data_column_type").val(null).change();
  },
  error: function(data) {
    console.log("ERROR!");
    console.log(data.error);

    var importSection = $(".import");
    var postSection = $(".post-process");
    importSection.markCompleted(false);
    postSection.slideUp();
    $("select.column-names").setOptions([]);
    $("#map_original_csv_data").val(null);
    $("#map_location_column_name").val(null);
    $("#map_data_column_name").val(null);
    $("#map_location_column_type").val(null);
    $("#map_data_column_type").val(null);
  },
  automateTitleGuessing: function() {
    var dataColumn = $("#map_data_column_name");
    var locationColumn = $("#map_location_column_name");
    $("#map_title").suggestable();
    var suggestTitle = function () {
      var title = [dataColumn.val() || "Data", locationColumn.val() || "Location"].join(" by ");
      $("#map_title").suggestValue(title);
    };
    dataColumn.change(suggestTitle);
    locationColumn.change(suggestTitle);
  },
  displayColumnSamples: function() {
    $("select.column-names").change(function () {
                                      console.log("CHANGED");
      var samples = $(this).find(":selected").attr("data-samples") + ", ...";
      $(this).parents("fieldset").find(".hint").text(samples);
    });
  }
};

// Automatically and immediately upload either a selected file or the
// copy-n-pasted data for a map.  Afterwards, populate the rest of map creation
// form with guessed defaults based on the ajax response.
$.fn.preprocessData = function(options) {
  options = options || {};
  return this.each(function() {
    var form = $(this);
    form[0].reset();

    var submitForm = function(callback) {
      form.ajaxSubmit({
        beforeSubmit: function(a,f,o) {
          o.dataType = 'json';
        },
        complete: function(request, textStatus) {
          var data = $.parseJSON(request.responseText);
          if (data.error) {
            if (options.error) options.error(data);
          } else {
            if (options.success) options.success(data);
          }
          if (callback) callback(data);
        }
      });
    };

    var fileInput = form.find("input[type=file]");
    var pasteArea = form.find("textarea");

    fileInput.change(function() {
      submitForm(function() { form[0].reset(); });
    });

    pasteArea.valueChangeObserver(500, function() {
      submitForm();
    });
  });
};

$.fn.sniffForCompletion = function() {
  return this.each(function() {
    var fieldset = $(this);
    var inputs = fieldset.find(":input");
    inputs.change(function() { 
      var allFilled = _.all(inputs, function(input) { return $(input).val() && !$(input).hasClass("suggested"); });
      fieldset.markCompleted(allFilled);
    }).change();
  });
};

$.fn.sniffForSubmittable = function(submit) {
  var inputs = this.find(":input");
  inputs.change(function() { 
    var allFilled = _.all(inputs, function(input) { return $(input).val(); });
    if (allFilled) {
      $(submit).removeAttr("disabled"); 
    } else {
      $(submit).attr("disabled", "disabled"); 
    }
  }).change();
  return this;
};

$.fn.markCompleted = function(on) {
  if (on) this.addClass("completed"); 
  else    this.removeClass("completed"); 
};

$.fn.suggestable = function() {
  this.focus(function() { $(this).removeClass("suggested"); })
      .blur(function() { $(this).change(); }); // triggers possible "completion" upon acceptance of suggested value
};

$.fn.suggestValue = function(text) {
  return this.each(function() {
    var input = $(this);  
    if (input.hasClass("suggested") || input.val() == input.attr("data-suggested") || input.val().length == 0) {
      input.val(text);
      input.addClass("suggested");
    }
    input.attr("data-suggested", text);
  });
};

$.fn.setColumnOptions = function(names, details) {
  return this.each(function() {
    var select = $(this);
    select.empty();
    _.each(names, function(name) {
      var samples = details[name].samples.join(", ");
      select.append(
        $("<option />")
          .val(name).text(name)
          .attr("data-samples", samples)
          .attr("data-guessed_type", details[name].guessed_type));
    });
  });
};

// Monitors a field for value changes every interval and fires the callback
// function only when a change is recognized.  This is good for monitoring an
// input or textarea field for copy-n-pasted changes that could come from
// keypresses, mouse context menus, or application menus.
$.fn.valueChangeObserver = function(interval, callback) {
  return this.each(function() {
    var self = $(this);
    var lastValue = self.val();
    var check = function() {
      var value = self.val();
      if (value != lastValue) {
        callback(self);
        lastValue = value;
      }
    };
    setInterval(check, interval);
  });
};

// protection against accidental left-over console.log statements
if (typeof console === "undefined") {
  console = { log: function() { } };
}

// ----------------------

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
}
